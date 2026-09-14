# CliniGuide AI

Post-discharge medication compliance companion. Patients photograph a
handwritten prescription, an AI reads it, a human confirms it, and reminders
go out over WhatsApp/SMS with a 3-tier escalation to family if a dose is
missed — plus a one-tap SOS button for emergencies.

Built for Global Innovation Hackathon 2026 (Healthcare + AI Tools).

## How it works

1. **Register once** — patient details + at least one guardian's WhatsApp number.
2. **Scan a prescription** — Gemini 2.5 Flash reads the photo and extracts drug
   name, dosage, and frequency shorthand (TID, BD, etc).
3. **Confirm before anything goes live** — every extracted field is shown back
   to the patient/guardian, editable, before it becomes a real schedule. Low
   confidence reads are flagged for double-checking rather than guessed.
4. **Daily reminders** — sent by WhatsApp and SMS at the scheduled time.
   - No confirmation after 1 minute → urgent reminder to the patient.
   - No confirmation after 3 minutes → guardian is alerted, and the patient is
     asked for a reason (already taken / forgot / unwell).
5. **Edit anytime** — add a new medicine, or update an existing one's dosage
   or timing, without rescanning anything.
6. **SOS button** — fixed at the top of the app, double-tap to broadcast an
   emergency alert to every guardian on WhatsApp and SMS instantly.

## Why the AI extraction is safe to rely on

Medical shorthand (TID, BD, PC, AC…) has fixed, standardized meanings — the
app never lets the AI decide what those mean. A hardcoded lookup table
(`backend/src/services/geminiService.js`) is the source of truth; Gemini's
only job is reading what's written on the page. Anything illegible, low
confidence, or not matching a known drug/shorthand is flagged
`needs_manual_review` and surfaced to the patient before it's trusted.

**This is a hackathon prototype, not a certified medical device.** It should
always be paired with a "confirm with your pharmacist if unsure" message in
the product, and is not a substitute for professional medical advice.

## Project structure

```
cliniguide-ai/
├── backend/     Node.js + Express API, SQLite, Gemini + Twilio integration
└── frontend/    React + Vite Progressive Web App (installable on Android)
```

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| AI extraction | Google Gemini 2.5 Flash (free tier) | Multimodal, reads handwriting from photos |
| Messaging | Twilio WhatsApp Sandbox + SMS (free tier) | Zero-cost, no app install needed for patients |
| Backend | Node.js, Express, SQLite (better-sqlite3), node-cron | Zero external hosting/database cost, simple to run anywhere |
| Frontend | React, Vite, Tailwind, vite-plugin-pwa | Installable PWA — feels like a native Android app with one codebase |

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# then fill in GEMINI_API_KEY and TWILIO_* values in .env
npm run dev
```

The API runs on `http://localhost:4000`. On first run it creates
`cliniguide.db` (SQLite) automatically from `src/db/schema.sql`.

**Get free API keys:**
- Gemini: https://aistudio.google.com/apikey
- Twilio WhatsApp Sandbox: https://console.twilio.com → Messaging → Try WhatsApp

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173`. To point it at a different backend URL,
create `frontend/.env` with:

```
VITE_API_URL=http://localhost:4000/api
```

### 3. Install as a PWA on Android

Once deployed (or running on your phone's browser over the same network),
open the site in Chrome → menu → **Add to Home screen**. It will launch
full-screen like a native app.

Add real icon files at `frontend/public/icons/icon-192.png` and
`icon-512.png` before deploying (placeholders are not included).

## Escalation timing

Configurable via `.env`:

```
REMINDER_TIER_2_MINUTES=1   # urgent reminder to patient
REMINDER_TIER_3_MINUTES=3   # alert guardian + ask patient for a reason
```

## Roadmap ideas (not yet built)

- Drug-name cross-check against a real drug database (e.g. RxNorm) for an
  extra safety layer beyond the shorthand lookup table.
- Multi-language voice reminders (currently uses the browser's default
  Web Speech voice for the selected language).
- Native push notifications (currently relies on WhatsApp/SMS delivery).
