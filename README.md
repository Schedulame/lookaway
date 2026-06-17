# Lookaway

A browser-based eye health tool that reminds you to follow the **20-20-20 rule** and take regular long breaks.

## What it does

- **Eye break timer** — every 20 minutes, reminds you to look at something 20 feet away for 20 seconds
- **Long break timer** — after 90 minutes of screen time, prompts you to stand up and step away
- **Face detection** — uses your webcam (locally, no data leaves your device) to pause timers when you're away from the desk and resume when you return
- **Float widget** — a small picture-in-picture window showing your character's state, stays on top while you work in other apps
- **Statistics** — tracks eye breaks completed, long breaks taken, and active/away time per day

## Tech

Vanilla TypeScript + Vite, no framework. WebGL background via [OGL](https://github.com/oframe/ogl). Face detection via MediaPipe. Document Picture-in-Picture API for the float widget.

## Run locally

```bash
npm install
npm run dev
```

Requires HTTPS (or localhost) for camera access.
