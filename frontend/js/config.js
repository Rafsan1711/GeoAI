// config.js - GeoAI Ultra Configuration

const CONFIG = {
    // API Configuration
    API: {
        BASE_URL: 'https://rafs-an09002-geoai-backend.hf.space',
        TIMEOUT: 15000,
        ENDPOINTS: {}
    },

    // Game Configuration - ULTRA MODE (Akinator-style: no hard limit)
    GAME: {
        MAX_QUESTIONS: 999999,
        MIN_CONFIDENCE_TO_GUESS: 95,
        EARLY_STOP_CONFIDENCE: 99,
        MIN_ITEMS_TO_GUESS: 1,
        THINKING_DURATION: 3000,
        QUESTION_DELAY: 500,
        ADAPTIVE_STOPPING: true,
    },

    // Data Paths — fetched directly from HF Space backend
    DATA: {
        PATHS: {
            COUNTRIES: 'https://rafs-an09002-geoai-backend.hf.space/api/data/countries',
            CITIES:    'https://rafs-an09002-geoai-backend.hf.space/api/data/cities',
            PLACES:    'https://rafs-an09002-geoai-backend.hf.space/api/data/places',
            QUESTIONS: 'https://rafs-an09002-geoai-backend.hf.space/api/data/questions'
        }
    },

    // UI Colors
    COLORS: {
        SUCCESS: '#10b981',
        ERROR:   '#ef4444',
        PRIMARY: '#6366f1'
    },

    // Feature Flags
    FEATURES: {
        USE_PYTHON_API: true,
        USE_SESSION_API: true,
        ENABLE_PWA: false,
    },

    // UI Configuration
    UI: {
        ENABLE_ANIMATIONS: true,
        CONFETTI_COUNT: 50,
        PARTICLE_COUNT: 30
    },

    // Debug Configuration
    DEBUG: {
        ENABLED: false,
        LOG_API_CALLS: false,
        LOG_ALGORITHM: false,
        LOG_QUESTIONS: false
    }
};
