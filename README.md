# Vibe Note

A professional prompt workspace for people who use AI tools daily. Save, organize, compose, and **run** prompts across ChatGPT, Claude, Gemini, Midjourney, and more — all stored locally on your device.

## What it does

Managing prompts is tedious. They end up scattered across browser tabs, notes apps, and chat histories. Vibe Note gives them a proper home:

- **Three kinds of items** — **Prompts** (reusable templates), **Notes** (freeform ideas), and **Contexts** (reusable background blocks injected into chats)
- **Fill variables** — write `{{topic}}` or `{{tone:formal|casual|professional}}` and the app turns your prompt into an interactive form
- **Chat with your prompts** — run any prompt in a persistent in-app chat with your own AI provider; conversations are saved, searchable, and resumable
- **Compose prompts** — link prompts to each other; after running one in chat, its linked prompts appear as one-tap "next step" suggestions
- **Search instantly** across titles, content, and tags with SQLite FTS5 relevance-ranked full-text search
- **Use AI** to import raw text and auto-organize it, generate new prompts from a description, or improve existing ones
- **Track usage** — see how often each prompt is used and recall what values you filled last time
- **Export and import** your full library as `.vibe` files for backup or sharing

## Features

| Feature | Details |
|---|---|
| Item kinds | Prompt, Note, Context — with per-kind filtering on Home |
| Variable templates | `{{var}}`, `{{var\|default}}`, `{{var:opt1\|opt2\|opt3}}` |
| Persistent chat | Multiple saved sessions, rename/pin/delete, auto-titles |
| Contexts | Attach reusable context blocks to a chat or a prompt — injected as system context |
| Prompt chains | Link prompts together; "next step" chips appear in chat after a prompt runs |
| Message actions | Copy any reply, save it as a note, or turn it into a prompt template |
| Run with variables | Attaching a prompt with variables to a chat opens an inline fill form first |
| Categories | Image, Video, Code, Writing, Marketing, Business, Music, Education + custom |
| Platforms | ChatGPT, Claude, Gemini, Midjourney, DALL-E, Sora, Cursor, v0, Lovable + custom |
| AI assistant | Chat, smart import, prompt generation, quality analysis |
| AI providers | Google Gemini, OpenAI, OpenRouter, **Anthropic Claude**, **Ollama (local)** — bring your own key |
| Search | Real FTS5 full-text search with BM25 relevance ranking (LIKE fallback) |
| Prompt views | List, **Notes**, Grid, and By-Category layouts |
| Token counter | Estimates token count per prompt |
| Languages | English, Arabic (RTL), French |
| Themes | 5 color themes (Light, Ocean, Forest, Sunset, Dark) |
| Storage | Local SQLite with versioned migrations — no cloud, no accounts |

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
