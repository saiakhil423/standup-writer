"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const child_process_1 = require("child_process");
const groq_sdk_1 = require("groq-sdk");
// ─── Git Helpers ────────────────────────────────────────────────────────────
function getWorkspacePath() {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0)
        return null;
    return folders[0].uri.fsPath;
}
function isGitRepo(cwd) {
    try {
        (0, child_process_1.execSync)("git rev-parse --is-inside-work-tree", { cwd, stdio: "ignore" });
        return true;
    }
    catch {
        return false;
    }
}
function getYesterdayCommits(cwd) {
    try {
        // Get commits from last 24 hours by the current git user
        const author = (0, child_process_1.execSync)("git config user.name", { cwd })
            .toString()
            .trim();
        const raw = (0, child_process_1.execSync)(`git log --since="24 hours ago" --author="${author}" --pretty=format:"%s" --no-merges`, { cwd })
            .toString()
            .trim();
        if (!raw)
            return [];
        return raw.split("\n").filter((line) => line.trim().length > 0);
    }
    catch {
        // Fallback: get last 10 commits regardless of time
        try {
            const raw = (0, child_process_1.execSync)(`git log -10 --pretty=format:"%s" --no-merges`, { cwd })
                .toString()
                .trim();
            return raw.split("\n").filter((line) => line.trim().length > 0);
        }
        catch {
            return [];
        }
    }
}
// ─── AI Generation ──────────────────────────────────────────────────────────
async function generateStandup(commits, apiKey, model) {
    const groq = new groq_sdk_1.default({ apiKey });
    const commitList = commits.map((c, i) => `${i + 1}. ${c}`).join("\n");
    const prompt = `You are a helpful assistant that writes daily standup updates for software developers.

Based on these git commits from the last 24 hours, write a concise, professional standup update.

Git commits:
${commitList}

Write the standup in this exact format:
**Yesterday:**
- [what was done, inferred from commits]

**Today:**
- [logical next steps based on the work]

**Blockers:**
- None (or suggest if something seems incomplete)

Keep it short, clear, and human-sounding. No fluff. Max 6 bullet points total.`;
    const response = await groq.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
    });
    return response.choices[0]?.message?.content ?? "Could not generate standup.";
}
// ─── Webview Panel ──────────────────────────────────────────────────────────
function getWebviewContent(standup, commits) {
    const commitItems = commits
        .map((c) => `<li>${escapeHtml(c)}</li>`)
        .join("");
    const standupHtml = standup
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n- /g, "<br>• ")
        .replace(/\n/g, "<br>");
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Standup Writer</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: 20px;
      line-height: 1.6;
    }
    h2 { color: var(--vscode-textLink-foreground); margin-bottom: 4px; }
    .standup-box {
      background: var(--vscode-editor-inactiveSelectionBackground);
      border-left: 3px solid var(--vscode-textLink-foreground);
      padding: 16px 20px;
      border-radius: 6px;
      margin: 16px 0;
      font-size: 14px;
    }
    .commits-box {
      background: var(--vscode-textBlockQuote-background);
      border-radius: 6px;
      padding: 12px 16px;
      font-size: 12px;
      opacity: 0.8;
    }
    .commits-box ul { margin: 4px 0; padding-left: 20px; }
    button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 8px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      margin-top: 12px;
    }
    button:hover { background: var(--vscode-button-hoverBackground); }
    .tag { font-size: 11px; opacity: 0.6; margin-bottom: 16px; }
  </style>
</head>
<body>
  <h2>✍️ Your Standup is Ready</h2>
  <p class="tag">Generated from ${commits.length} commit${commits.length !== 1 ? "s" : ""} in the last 24 hours</p>

  <div class="standup-box" id="standup">
    ${standupHtml}
  </div>

  <button onclick="copyStandup()">📋 Copy to Clipboard</button>

  <br><br>
  <details>
    <summary style="cursor:pointer; opacity:0.7; font-size:12px;">View raw commits used</summary>
    <div class="commits-box">
      <ul>${commitItems}</ul>
    </div>
  </details>

  <script>
    const vscode = acquireVsCodeApi();
    function copyStandup() {
      const text = document.getElementById('standup').innerText;
      navigator.clipboard.writeText(text).then(() => {
        vscode.postMessage({ command: 'copied' });
      });
    }
  </script>
</body>
</html>`;
}
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
// ─── Main Activation ────────────────────────────────────────────────────────
function activate(context) {
    const disposable = vscode.commands.registerCommand("standup-writer.generate", async () => {
        // 1. Check workspace
        const workspacePath = getWorkspacePath();
        if (!workspacePath) {
            vscode.window.showErrorMessage("Standup Writer: Please open a project folder first.");
            return;
        }
        // 2. Check git
        if (!isGitRepo(workspacePath)) {
            vscode.window.showErrorMessage("Standup Writer: This folder is not a git repository.");
            return;
        }
        // 3. Check API key
        const config = vscode.workspace.getConfiguration("standupWriter");
        let apiKey = config.get("groqApiKey") ?? "";
        if (!apiKey) {
            apiKey =
                (await vscode.window.showInputBox({
                    prompt: "Enter your Groq API key to get started",
                    password: true,
                    placeHolder: "groq-...",
                    ignoreFocusOut: true,
                })) ?? "";
            if (!apiKey) {
                vscode.window.showWarningMessage("Standup Writer: API key is required. Add it in Settings → Standup Writer.");
                return;
            }
            // Save for future use
            await config.update("groqApiKey", apiKey, vscode.ConfigurationTarget.Global);
        }
        // 4. Get commits
        const commits = getYesterdayCommits(workspacePath);
        if (commits.length === 0) {
            vscode.window.showWarningMessage("Standup Writer: No commits found in the last 24 hours. Make sure you have commits today or yesterday.");
            return;
        }
        // 5. Generate with loading indicator
        const model = config.get("model") ?? "llama-3.1-8b-instant";
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "✍️ Writing your standup...",
            cancellable: false,
        }, async () => {
            try {
                const standup = await generateStandup(commits, apiKey, model);
                // 6. Show in webview panel
                const panel = vscode.window.createWebviewPanel("standupWriter", "Standup Writer", vscode.ViewColumn.Beside, { enableScripts: true });
                panel.webview.html = getWebviewContent(standup, commits);
                // Handle copy confirmation
                panel.webview.onDidReceiveMessage((message) => {
                    if (message.command === "copied") {
                        vscode.window.showInformationMessage("✅ Standup copied to clipboard! Go paste it in Slack/Teams.");
                    }
                });
            }
            catch (err) {
                vscode.window.showErrorMessage(`Standup Writer: ${err?.message ?? "Something went wrong. Check your API key."}`);
            }
        });
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map