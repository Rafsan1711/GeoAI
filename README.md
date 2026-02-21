# 🌍 GeoAI

An Akinator-style AI that guesses countries through yes/no questions using a Bayesian inference engine.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Backend](https://img.shields.io/badge/Backend-HuggingFace%20Spaces-yellow)](https://huggingface.co/spaces/rafsan1711/geoai-backend)
[![CI](https://github.com/rafsan1711/geoai/actions/workflows/sync-backend.yml/badge.svg)](https://github.com/rafsan1711/geoai/actions)

## How It Works

1. User thinks of a country
2. AI asks yes/no/probably questions (continent, population, landlocked, etc.)
3. Bayesian engine narrows down candidates using information gain
4. AI guesses the country — usually within 10–25 questions

## Repository Structure

```
geoai/
├── backend/          # Flask API — synced to HuggingFace Docker Space
│   ├── app.py
│   ├── core/         # Inference engine, question selector, etc.
│   ├── algorithms/   # Bayesian network, information gain
│   ├── models/       # Game state, item model
│   ├── services/     # Firebase service
│   ├── utils/        # Data loader, logger
│   ├── data/         # countries.json, questions.json
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/         # Vanilla HTML/CSS/JS
├── Debug/            # Auto-generated bot test reports
│   ├── Countries/    # Per-country debug Markdown files
│   └── REPORT.md     # Summary report
├── .github/workflows/
│   ├── sync-backend.yml   # Push backend → HF Spaces on main push
│   └── bot-test.yml       # Run bot tests when data files change
├── CHANGELOG.md
└── LICENSE
```

## Setup

### Backend (HuggingFace Docker Space)

1. Create a [HuggingFace Docker Space](https://huggingface.co/new-space?sdk=docker)
2. Add GitHub secret `HF_TOKEN` (your HF write token)
3. Push to `main` — GitHub Actions auto-syncs the `backend/` folder

### Frontend

Static files — deploy anywhere (GitHub Pages, Cloudflare Pages, etc.).  
Update `frontend/js/config.js` with your HF Space URL.

### Environment Variables (HF Space Secrets)

| Variable | Description |
|----------|-------------|
| `FIREBASE_DATABASE_URL` | Firebase RTDB URL |
| `FIREBASE_API_KEY` | Firebase API key |

## License

[GNU General Public License v3.0](LICENSE)