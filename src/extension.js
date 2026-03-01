"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
var vscode = require("vscode");
var child_process_1 = require("child_process");
var openai_1 = require("openai");
// ─── Git Helpers ────────────────────────────────────────────────────────────
function getWorkspacePath() {
    var folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0)
        return null;
    return folders[0].uri.fsPath;
}
function isGitRepo(cwd) {
    try {
        (0, child_process_1.execSync)("git rev-parse --is-inside-work-tree", { cwd: cwd, stdio: "ignore" });
        return true;
    }
    catch (_a) {
        return false;
    }
}
function getYesterdayCommits(cwd) {
    try {
        // Get commits from last 24 hours by the current git user
        var author = (0, child_process_1.execSync)("git config user.name", { cwd: cwd })
            .toString()
            .trim();
        var raw = (0, child_process_1.execSync)("git log --since=\"24 hours ago\" --author=\"".concat(author, "\" --pretty=format:\"%s\" --no-merges"), { cwd: cwd })
            .toString()
            .trim();
        if (!raw)
            return [];
        return raw.split("\n").filter(function (line) { return line.trim().length > 0; });
    }
    catch (_a) {
        // Fallback: get last 10 commits regardless of time
        try {
            var raw = (0, child_process_1.execSync)("git log -10 --pretty=format:\"%s\" --no-merges", { cwd: cwd })
                .toString()
                .trim();
            return raw.split("\n").filter(function (line) { return line.trim().length > 0; });
        }
        catch (_b) {
            return [];
        }
    }
}
// ─── AI Generation ──────────────────────────────────────────────────────────
function generateStandup(commits, apiKey, model) {
    return __awaiter(this, void 0, void 0, function () {
        var openai, commitList, prompt, response;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    openai = new openai_1.default({ apiKey: apiKey });
                    commitList = commits.map(function (c, i) { return "".concat(i + 1, ". ").concat(c); }).join("\n");
                    prompt = "You are a helpful assistant that writes daily standup updates for software developers.\n\nBased on these git commits from the last 24 hours, write a concise, professional standup update.\n\nGit commits:\n".concat(commitList, "\n\nWrite the standup in this exact format:\n**Yesterday:**\n- [what was done, inferred from commits]\n\n**Today:**\n- [logical next steps based on the work]\n\n**Blockers:**\n- None (or suggest if something seems incomplete)\n\nKeep it short, clear, and human-sounding. No fluff. Max 6 bullet points total.");
                    return [4 /*yield*/, openai.chat.completions.create({
                            model: model,
                            messages: [{ role: "user", content: prompt }],
                            max_tokens: 300,
                            temperature: 0.7,
                        })];
                case 1:
                    response = _d.sent();
                    return [2 /*return*/, (_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) !== null && _c !== void 0 ? _c : "Could not generate standup."];
            }
        });
    });
}
// ─── Webview Panel ──────────────────────────────────────────────────────────
function getWebviewContent(standup, commits) {
    var commitItems = commits
        .map(function (c) { return "<li>".concat(escapeHtml(c), "</li>"); })
        .join("");
    var standupHtml = standup
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n- /g, "<br>• ")
        .replace(/\n/g, "<br>");
    return "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Standup Writer</title>\n  <style>\n    body {\n      font-family: var(--vscode-font-family);\n      color: var(--vscode-foreground);\n      background: var(--vscode-editor-background);\n      padding: 20px;\n      line-height: 1.6;\n    }\n    h2 { color: var(--vscode-textLink-foreground); margin-bottom: 4px; }\n    .standup-box {\n      background: var(--vscode-editor-inactiveSelectionBackground);\n      border-left: 3px solid var(--vscode-textLink-foreground);\n      padding: 16px 20px;\n      border-radius: 6px;\n      margin: 16px 0;\n      font-size: 14px;\n    }\n    .commits-box {\n      background: var(--vscode-textBlockQuote-background);\n      border-radius: 6px;\n      padding: 12px 16px;\n      font-size: 12px;\n      opacity: 0.8;\n    }\n    .commits-box ul { margin: 4px 0; padding-left: 20px; }\n    button {\n      background: var(--vscode-button-background);\n      color: var(--vscode-button-foreground);\n      border: none;\n      padding: 8px 20px;\n      border-radius: 4px;\n      cursor: pointer;\n      font-size: 13px;\n      margin-top: 12px;\n    }\n    button:hover { background: var(--vscode-button-hoverBackground); }\n    .tag { font-size: 11px; opacity: 0.6; margin-bottom: 16px; }\n  </style>\n</head>\n<body>\n  <h2>\u270D\uFE0F Your Standup is Ready</h2>\n  <p class=\"tag\">Generated from ".concat(commits.length, " commit").concat(commits.length !== 1 ? "s" : "", " in the last 24 hours</p>\n\n  <div class=\"standup-box\" id=\"standup\">\n    ").concat(standupHtml, "\n  </div>\n\n  <button onclick=\"copyStandup()\">\uD83D\uDCCB Copy to Clipboard</button>\n\n  <br><br>\n  <details>\n    <summary style=\"cursor:pointer; opacity:0.7; font-size:12px;\">View raw commits used</summary>\n    <div class=\"commits-box\">\n      <ul>").concat(commitItems, "</ul>\n    </div>\n  </details>\n\n  <script>\n    const vscode = acquireVsCodeApi();\n    function copyStandup() {\n      const text = document.getElementById('standup').innerText;\n      navigator.clipboard.writeText(text).then(() => {\n        vscode.postMessage({ command: 'copied' });\n      });\n    }\n  </script>\n</body>\n</html>");
}
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
// ─── Main Activation ────────────────────────────────────────────────────────
function activate(context) {
    var _this = this;
    var disposable = vscode.commands.registerCommand("standup-writer.generate", function () { return __awaiter(_this, void 0, void 0, function () {
        var workspacePath, config, apiKey, commits, model;
        var _this = this;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    workspacePath = getWorkspacePath();
                    if (!workspacePath) {
                        vscode.window.showErrorMessage("Standup Writer: Please open a project folder first.");
                        return [2 /*return*/];
                    }
                    // 2. Check git
                    if (!isGitRepo(workspacePath)) {
                        vscode.window.showErrorMessage("Standup Writer: This folder is not a git repository.");
                        return [2 /*return*/];
                    }
                    config = vscode.workspace.getConfiguration("standupWriter");
                    apiKey = (_a = config.get("openaiApiKey")) !== null && _a !== void 0 ? _a : "";
                    if (!!apiKey) return [3 /*break*/, 3];
                    return [4 /*yield*/, vscode.window.showInputBox({
                            prompt: "Enter your OpenAI API key to get started",
                            password: true,
                            placeHolder: "sk-...",
                            ignoreFocusOut: true,
                        })];
                case 1:
                    apiKey =
                        (_b = (_d.sent())) !== null && _b !== void 0 ? _b : "";
                    if (!apiKey) {
                        vscode.window.showWarningMessage("Standup Writer: API key is required. Add it in Settings → Standup Writer.");
                        return [2 /*return*/];
                    }
                    // Save for future use
                    return [4 /*yield*/, config.update("openaiApiKey", apiKey, vscode.ConfigurationTarget.Global)];
                case 2:
                    // Save for future use
                    _d.sent();
                    _d.label = 3;
                case 3:
                    commits = getYesterdayCommits(workspacePath);
                    if (commits.length === 0) {
                        vscode.window.showWarningMessage("Standup Writer: No commits found in the last 24 hours. Make sure you have commits today or yesterday.");
                        return [2 /*return*/];
                    }
                    model = (_c = config.get("model")) !== null && _c !== void 0 ? _c : "gpt-3.5-turbo";
                    return [4 /*yield*/, vscode.window.withProgress({
                            location: vscode.ProgressLocation.Notification,
                            title: "✍️ Writing your standup...",
                            cancellable: false,
                        }, function () { return __awaiter(_this, void 0, void 0, function () {
                            var standup, panel, err_1;
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _b.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, generateStandup(commits, apiKey, model)];
                                    case 1:
                                        standup = _b.sent();
                                        panel = vscode.window.createWebviewPanel("standupWriter", "Standup Writer", vscode.ViewColumn.Beside, { enableScripts: true });
                                        panel.webview.html = getWebviewContent(standup, commits);
                                        // Handle copy confirmation
                                        panel.webview.onDidReceiveMessage(function (message) {
                                            if (message.command === "copied") {
                                                vscode.window.showInformationMessage("✅ Standup copied to clipboard! Go paste it in Slack/Teams.");
                                            }
                                        });
                                        return [3 /*break*/, 3];
                                    case 2:
                                        err_1 = _b.sent();
                                        vscode.window.showErrorMessage("Standup Writer: ".concat((_a = err_1 === null || err_1 === void 0 ? void 0 : err_1.message) !== null && _a !== void 0 ? _a : "Something went wrong. Check your API key."));
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); })];
                case 4:
                    _d.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    context.subscriptions.push(disposable);
}
function deactivate() { }
