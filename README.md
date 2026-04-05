# Mood Refreshment

This repository contains:

- **`mobile/`** — Expo / React Native app (Android / iOS).
- **`server/`** — REST API and Socket.IO backend (SQLite).

## API

From the repo root (use a `.env` next to `server/` as you already do for email, etc.):

```bash
npm install
npm run server
```

## Mobile app

```bash
cd mobile
npm install
npm run android
```

The app expects the API on port **3001** (see `mobile/src/config.js` and optional `mobile/.env`).

## Mood check-in UX (what’s implemented)

- **Mood picker (fast & fun)**: energy slider + emoji-based mood selection.
- **Instant insights**: weekly overview with charts + average energy.
- **Feel‑good reminders**: optional daily notification “How’s your vibe today?” (set in Profile → Settings → Reminders).
- **Celebrate progress**: streak + badges/achievements in Insights.

## Journal “Text Customizer” (what’s implemented)

- **Font**: choose between Clean / Bold / Serif styles.
- **Text size**: quick presets (15 / 17 / 19 / 22).
- **Text color**: Auto + a small palette (Ink / Blue / Green / Pink).
- **Alignment**: left / center / right.
- **Text styles**: bold / italic / underline (applies to the whole entry).
- **Page themes**: Auto / Airy / Night / Nature background tints.
- **Stickers**: one‑tap emoji inserts (✨ 🌿 ⭐ 💛 🌸 🫧).

All customizations are saved per entry via the `style` field on `JournalEntries`.

## Lint

```bash
npm run lint
```
