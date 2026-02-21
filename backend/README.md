---
title: GeoAI Backend
emoji: 🌍
colorFrom: indigo
colorTo: purple
sdk: docker
pinned: false
license: gpl-3.0
---

# GeoAI Backend

Flask REST API powering the GeoAI geography guessing game.  
Synced automatically from [github.com/rafsan1711/geoai](https://github.com/rafsan1711/geoai) via GitHub Actions.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/start-game` | Start a new game session |
| POST | `/api/question` | Get next question |
| POST | `/api/answer` | Submit answer |
| POST | `/api/predict` | Get final prediction |
| POST | `/api/feedback` | Submit correction |
| GET | `/api/stats` | Session stats |

## Environment Variables

Set these in HuggingFace Space → Settings → Variables & Secrets:

| Variable | Description |
|----------|-------------|
| `FIREBASE_DATABASE_URL` | Your Firebase RTDB URL |
| `FIREBASE_API_KEY` | Firebase API key |
| `FLASK_DEBUG` | `false` for production |
| `LOG_LEVEL` | `INFO` or `DEBUG` |

## License

GNU General Public License v3.0 — see [LICENSE](../LICENSE)
