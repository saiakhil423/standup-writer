# ✍️ Standup Writer

**Auto-generate your daily standup from yesterday's git commits using Groq AI.**

No more staring at a blank Slack message every morning wondering what you did yesterday.

---

## How It Works

1. Press `Ctrl+Shift+P` → type **"Generate My Standup"**
2. Enter your Groq API key (one time only)
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
4. Enter your Groq API key when prompted (stored securely in VS Code settings)

### Getting a Groq API Key
Visit [console.groq.com](https://console.groq.com) and sign up for a free account, then create an API key.

---

## Settings

| Setting | Default | Description |
|---|---|---|
| `standupWriter.groqApiKey` | `""` | Your Groq API key |
| `standupWriter.model` | `llama-3.1-8b-instant` | Model to use (see configuration options) |

---

## Requirements

- A git repository open in VS Code
- A Groq API key
- At least one commit in the last 24 hours

---

## Privacy

Your commits are sent to Groq's API to generate the standup. No data is stored anywhere else. Your API key is stored locally in VS Code settings only.

---

## Roadmap

- [ ] Slack direct integration
- [ ] Multiple repo support
- [ ] Tone selector (formal / casual)
- [ ] Custom standup templates

---

Built with ❤️ by [Sai Akhil](https://github.com/saiakhil423)