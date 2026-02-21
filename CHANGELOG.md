# Changelog

All notable changes to GeoAI are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [v1.0.1] — CI/CD & Infrastructure

### Added
- **GitHub Actions: Sync Backend → HF Space** (`.github/workflows/sync-backend.yml`)  
  Automatically pushes `backend/` folder as root to HuggingFace Docker Space on every `main` push that touches backend files.
- **GitHub Actions: File Size Check** (`.github/workflows/check-file-size.yml`)  
  Warns on PRs if any file exceeds 10MB (HF Spaces Git-LFS limit).
- **Dockerfile** for HuggingFace Docker Space (`backend/Dockerfile`)  
  Runs Flask app via gunicorn on port 7860 (HF Spaces standard port).
- **Root `README.md`** — full project overview, setup guide, repo structure.
- **`backend/README.md`** — API endpoint docs, environment variable reference.
- **`frontend/README.md`** — frontend structure, config guide, debug system docs.
- **`CHANGELOG.md`** — this file.
- **`LICENSE`** — GNU General Public License v3.0.
- **`Debug/Countries/`** folder placeholder for future bot test reports.

### Changed
- Backend deployment target changed from **Render.com** to **HuggingFace Docker Space**.
- `backend/config.py` port default updated to `7860` for HF Spaces compatibility.

### Removed
- `Procfile` — Render.com specific, no longer needed.
- `runtime.txt` — Render.com Python version pin, no longer needed.
- `__init___1_.py`, `__init___2_.py`, `__init___3_.py` — prototype export artifacts.
- `dataset.js` — unused prototype file.
- `package.json` — no npm build pipeline exists.

---

## [v1.0.0] — Initial Release

### Core Features

#### Backend (Flask + Bayesian AI Engine)
- **`app.py`** — Flask REST API with endpoints:
  - `GET /health` — health check with version and data stats
  - `POST /api/start-game` — initialise a new game session with category + question bank
  - `POST /api/question` — get next best question using information gain
  - `POST /api/answer` — submit answer, update Bayesian probabilities
  - `POST /api/predict` — get final prediction, clean up session
  - `POST /api/feedback` — user correction: boost actual answer, re-continue game
  - `GET /api/stats` — session and data statistics
- **`core/inference_engine.py`** — Akinator-style engine; no hard question limit, stops when confident
- **`core/question_selector.py`** — selects optimal next question via weighted score (information gain 45%, strategy 30%, Bayesian belief 15%, balance split 5%, feature importance 5%)
- **`core/probability_manager.py`** — normalises and soft-filters item probabilities
- **`core/confidence_calculator.py`** — multi-factor confidence score (probability gap, normalised prob, item count, entropy)
- **`algorithms/bayesian_network.py`** — Bayesian likelihood update engine
- **`algorithms/information_gain.py`** — Shannon entropy-based information gain
- **`models/game_state.py`** — per-session game state with answer history and statistics
- **`models/item_model.py`** — country/item model with probability and elimination flag
- **`services/firebase_service.py`** — Firebase RTDB REST API (no heavy SDK); singleton pattern; game state persistence and analytics logging
- **`utils/data_loader.py`** — loads `countries.json` / `questions.json` from `data/` folder
- **`utils/logger.py`** — structured logging setup
- **`config.py`** — centralised config: Firebase, game thresholds, algorithm weights, deployment settings
- **`requirements.txt`** — Flask 3.0.0, Flask-CORS 4.0.0, gunicorn 21.2.0, requests 2.31.0, python-dotenv 1.0.0

#### Data
- **`data/countries.json`** — country dataset with attributes (continent, region, population, landlocked, island, etc.)
- **`data/questions.json`** — question bank mapped to country attributes and values

#### Frontend (Vanilla JS)
- **`index.html`** — single-page app shell with all screens
- **`js/config.js`** — API base URL, game config flags, data paths, debug config
- **`js/api.js`** — all backend API calls with error handling
- **`js/game.js`** — complete game flow
- **`js/debug.js`** — in-session debug logger; Shift+D+L downloads detailed Markdown report
- **`js/animations.js`** — particle effects, screen transitions, confetti
- **`js/main.js`** — app entry point, global init
- **`css/`** — base, components, screens, animations, responsive, feedback_ui
- **`_env.example`** — example environment variables file