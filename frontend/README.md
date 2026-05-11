# GuessMyPlace Frontend
Built with React + TypeScript + Vite

## Setup
```bash
npm install
cp .env.example .env
# Fill in Firebase config and API baseUrl
npm run dev
```

## Build
```bash
npm run build
```

## Deploy
Connected to Vercel via GitHub Actions.
Push to main → auto-deploys.

## Environment Variables
- `VITE_API_BASE_URL`: The backend URL for the game engine.
- `VITE_FIREBASE_API_KEY`: Firebase API Key.
- `VITE_FIREBASE_AUTH_DOMAIN`: Firebase Auth Domain.
- `VITE_FIREBASE_PROJECT_ID`: Firebase Project ID.
- `VITE_FIREBASE_DATABASE_URL`: Firebase Database URL (if using Realtime Database).
- `VITE_FIREBASE_APP_ID`: Firebase App ID.
