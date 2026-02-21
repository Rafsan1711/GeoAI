// config.js - Ultra Configuration for Maximum Accuracy

const CONFIG = {
    // API Configuration
    API: {
        BASE_URL: 'https://sliding-puzzle-with-solver-ida-1.onrender.com',
        TIMEOUT: 10000,
        ENDPOINTS: { /* Defined in api_enhanced.js */ }
    },

    // Game Configuration - ULTRA MODE (Akinator-style: no hard limit)
    GAME: {
        MAX_QUESTIONS: 999999,       // ✅ FIX: No question limit — AI guesses as soon as confident
        MIN_CONFIDENCE_TO_GUESS: 95,
        EARLY_STOP_CONFIDENCE: 99,
        MIN_ITEMS_TO_GUESS: 1,
        THINKING_DURATION: 3000,
        QUESTION_DELAY: 500,
        ADAPTIVE_STOPPING: true,
    },

    // Data Paths
    DATA: {
        PATHS: {
            COUNTRIES: 'data/countries.json',
            CITIES: 'data/cities.json',
            PLACES: 'data/places.json',
            QUESTIONS: 'data/questions.json'
        }
    },

    // UI Colors
    COLORS: {
        SUCCESS: '#10b981',
        ERROR: '#ef4444',
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
        ENABLED: true,
        LOG_API_CALLS: true,
        LOG_ALGORITHM: false,
        LOG_QUESTIONS: false
    }
};
