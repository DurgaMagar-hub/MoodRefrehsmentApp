# Mood Refreshment

A cross-platform mental wellness companion built with **Expo (React Native)** and a **Node.js** backend. Users track mood, keep a journal with rich text styling, receive gentle reminders, and participate in moderated real-time chat—with admin tooling for insights and safety.

---

## Overview

| Layer | Technology |
|--------|------------|
| Mobile | Expo ~54, React Native, React Navigation, Socket.IO client |
| Backend | Express 5, Socket.IO, SQLite (`sqlite3`) |
| Auth | Google Sign-In (ID token verification on server) |

The mobile app talks to a REST API on **port 3001** and uses the same host for **WebSocket** chat. Copy `.env.example` to `.env` at the **repository root** (next to `server/`) and fill in secrets; `.env` is not committed.

---

## Features

**Mood & insights**

- Quick mood check-ins with energy and emoji-based selection  
- Weekly summaries, charts, averages, streaks, and achievements  
- Optional daily reminder: *“How’s your vibe today?”* (Profile → Settings → Reminders)

**Journal**

- Per-entry **text customizer**: font family, size, color, alignment, bold/italic/underline  
- Page themes (e.g. airy / night / nature) and quick sticker inserts  
- Styles persisted on each journal entry via the API

**Social & safety**

- Real-time **emotion rooms** chat over Socket.IO  
- Reporting flow for users and guests; admin views for reports and moderation-related actions

**Admin**

- Dashboard for operational tasks; navigation tuned for admin flows (e.g. hardware back handling on Android root)

---

## Prerequisites

- **Node.js** (LTS recommended) and npm  
- **Expo CLI** / `npx expo` (as used in `mobile/package.json`)  
- For Android: Android Studio / SDK and a device or emulator; **adb** if you use USB debugging and port reverse  

---

## Quick start

### 1. Backend (from repository root)

```bash
npm install
cp .env.example .env   # then edit .env with your values
npm run server
```

The API listens on **http://localhost:3001** (REST under `/api`).

### 2. Mobile app

```bash
cd mobile
npm install
npx expo start
```

Use `npx expo run:android` or `npx expo run:ios` for a dev build when needed.

### 3. Pointing the app at your machine

The client resolves the API host from `mobile/src/config.js` (emulator, LAN, optional env overrides). For a **physical device on Wi‑Fi**, set your PC’s IP in `mobile/.env`, for example:

```env
EXPO_PUBLIC_DEV_API_HOST=192.168.x.x
```

Restart Metro after changes. For **USB + adb**, you can reverse ports and use `127.0.0.1` as described in `config.js` comments.

### 4. Optional: one-command dev helper (Android USB)

From the repo root (requires `adb`):

```bash
npm run dev
```

This starts the server, runs `adb reverse` for ports 3001 and 8081, then starts Expo with a clear cache and LAN host.

---

## Environment variables

| Variable | Used by | Purpose |
|----------|---------|---------|
| `VITE_GOOGLE_CLIENT_ID` | Server | Audience for Google ID token verification |
| `EMAIL_USER`, `EMAIL_PASS` | Server | Outbound email (e.g. Nodemailer) |
| `EXPO_PUBLIC_DEV_API_HOST` | Mobile | Override API/WebSocket host in development |
| `EXPO_PUBLIC_GOOGLE_*` | Mobile | Google client IDs when not baked into `app.json` extra |

See `.env.example` for a minimal template. **Do not commit** real credentials.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run server` | Start the API + Socket.IO server |
| `npm run dev` | Backend + adb reverse + Expo (see `scripts/dev-start.sh`) |
| `npm run lint` | ESLint on `server/` |
| `cd mobile && npx expo start` | Metro bundler for the app |

---

## Repository layout

```
├── mobile/          # Expo React Native application
├── server/          # Express + SQLite + Socket.IO
├── scripts/         # Development helpers
├── .env.example     # Template for root `.env`
└── package.json     # Root dependencies and server scripts
```

Native `android/` / `ios/` folders are generated locally with Expo prebuild when you need them; they are not required in the tree for day-to-day JS development.

---

## Quality checks

```bash
npm run lint
```

---

## License

No license file is included in this repository. Add a `LICENSE` if you plan to publish or redistribute the code.
