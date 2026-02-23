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
.
├── .env.example
├── .github
│   └── workflows
│       ├── check-file-size.yml
│       ├── sync-backend.yml
│       ├── sync-data-files.yml
│       └── update-readme-structure.yml
├── CHANGELOG.md
├── Debug
│   ├── Countries
            └── All-Countries-Debug.md  (115+ country files collapsed)
│   └── REPORT.md
├── LICENSE
├── README.md
├── backend
│   ├── Dockerfile
│   ├── README.md
│   ├── algorithms
│   │   ├── __init__.py
│   │   ├── bayesian_network.py
│   │   ├── feature_importance.py
│   │   └── information_gain.py
│   ├── analytics
│   │   └── performance_tracker.py
│   ├── app.py
│   ├── config.py
│   ├── core
│   │   ├── __init__.py
│   │   ├── confidence_calculator.py
│   │   ├── inference_engine.py
│   │   ├── probability_manager.py
│   │   └── question_selector.py
│   ├── data
│   │   ├── countries.json
│   │   └── questions.json
│   ├── models
│   │   ├── __init__.py
│   │   ├── game_state.py
│   │   └── item_model.py
│   ├── requirements.txt
│   ├── services
│   │   └── firebase_service.py
│   ├── tests
│   │   └── test_accuracy.py
│   └── utils
│       ├── __init__.py
│       ├── data_loader.py
│       └── logger.py
└── frontend
    ├── bot.html
    ├── css
    │   ├── animations.css
    │   ├── base.css
    │   ├── components.css
    │   ├── feedback_ui.css
    │   ├── responsive.css
    │   └── screens.css
    ├── data
    │   ├── countries.json
    │   └── questions.json
    ├── index.html
    └── js
        ├── animations.js
        ├── api.js
        ├── config.js
        ├── dataset.js
        ├── debug.js
        ├── game.js
        └── main.js
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