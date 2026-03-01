# ✍️ Standup Writer

**Auto-generate your daily standup from yesterday's git commits using AI.**

No more staring at a blank Slack message every morning wondering what you did yesterday.

---

## How It Works

1. Press `Ctrl+Shift+P` → type **"Generate My Standup"**
2. Enter your OpenAI API key (one time only)
3. Get your standup in 5 seconds — ready to copy and paste

That's it.

---

## Example Output

Given commits like:
- `fix: resolve JWT token expiry bug in auth middleware`
- `feat: add pagination to user list endpoint`
- `refactor: clean up database connection pooling`

You get:

**Yesterday:**
- Fixed a JWT token expiry bug in the authentication middleware
- Added pagination support to the user list API endpoint
- Refactored database connection pooling for better performance

**Today:**
- Test the auth fix across edge cases
- Review pagination implementation with the team

**Blockers:**
- None

---

## Setup

1. Install the extension
2. Open any git repository in VS Code
3. Run `Ctrl+Shift+P` → **Standup Writer: Generate My Standup**
4. Enter your OpenAI API key when prompted (stored securely in VS Code settings)

### Getting an OpenAI API Key
Go to [platform.openai.com](https://platform.openai.com) → API Keys → Create new key.

---

## Settings

| Setting | Default | Description |
|---|---|---|
| `standupWriter.openaiApiKey` | `""` | Your OpenAI API key |
| `standupWriter.model` | `gpt-3.5-turbo` | Model to use (`gpt-3.5-turbo` or `gpt-4`) |

---

## Requirements

- A git repository open in VS Code
- An OpenAI API key
- At least one commit in the last 24 hours

---

## Privacy

Your commits are sent to OpenAI's API to generate the standup. No data is stored anywhere else. Your API key is stored locally in VS Code settings only.

---

## Roadmap

- [ ] Slack direct integration
- [ ] Multiple repo support
- [ ] Tone selector (formal / casual)
- [ ] Custom standup templates

---

Built with ❤️ by [Sai Akhil](https://github.com/saiakhil423)