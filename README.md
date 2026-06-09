# Vibe Note

A prompt manager for people who use AI tools daily. Save, organize, and reuse prompts across ChatGPT, Claude, Gemini, Midjourney, and more — all stored locally on your device.

## What it does

Managing prompts is tedious. They end up scattered across browser tabs, notes apps, and chat histories. Vibe Note gives them a proper home:

- **Save prompts** with title, category, AI platform tag, and custom tags
- **Fill variables** — write `{{topic}}` or `{{tone:formal|casual|professional}}` and the app turns your prompt into an interactive form
- **Search instantly** across titles, content, and tags with full-text search
- **Use AI** to import raw text and auto-organize it, generate new prompts from a description, or improve existing ones
- **Track usage** — see how often each prompt is used and recall what values you filled last time
- **Export and import** your full library as `.vibe` files for backup or sharing

## Features

| Feature | Details |
|---|---|
| Variable templates | `{{var}}`, `{{var\|default}}`, `{{var:opt1\|opt2\|opt3}}` |
| Categories | Image, Video, Code, Writing, Marketing, Business, Music, Education + custom |
| Platforms | ChatGPT, Claude, Gemini, Midjourney, DALL-E, Sora, Cursor, v0, Lovable + custom |
| AI assistant | Redesigned chat, smart import, prompt generation, quality analysis |
| Chat with a prompt | Run any prompt in-app instead of copying it out; chain prompts together in one conversation |
| Prompt views | List, **Notes**, Grid, and By-Category layouts |
| AI providers | Google Gemini, OpenAI, OpenRouter (bring your own key) |
| Token counter | Estimates token count per prompt |
| Languages | English, Arabic (RTL), French |
| Themes | 5 color themes (Light, Ocean, Forest, Sunset, Dark) |
| Storage | Local SQLite — no cloud, no accounts |

## Stack

| | Version |
|---|---|
| Expo SDK | 56 |
| React Native | 0.85.3 |
| TypeScript | 6.0 |
| State | Zustand 5.0 |
| Database | expo-sqlite (SQLite + FTS5) |

## Getting Started

```bash
git clone https://github.com/Zizwar/proomy-note.git
cd proomy-note
npm install
npm start
```

Scan the QR code with Expo Go, or press `a` for Android emulator.

## Privacy

All data is stored on your device. API keys are stored with `expo-secure-store`. No analytics, no tracking, no cloud sync.

## License

MIT — see [LICENSE](LICENSE).
