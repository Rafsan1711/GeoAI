// game.js - GeoAI Ultra Game Manager (v1.3.0)

class Game {
    constructor() {
        this.state = {
            category:        null,
            currentQuestion: null,
            questionNumber:  0,
            maxQuestions:    CONFIG.GAME.MAX_QUESTIONS,
            askedQuestions:  [],
            possibleItems:   [],
            answers:         [],
            questions:       null,
            usingBackend:    false,
            sessionId:       null,
            maxConfidence:   0
        };

        this.dataLoaded      = false;
        this.questionBank    = {};
        this.thinkingDuration = CONFIG.GAME.THINKING_DURATION;
    }

    // ── Initialization ────────────────────────────────────────────────────────

    async initialize() {
        try {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) loadingScreen.classList.remove('hidden');

            const data = await apiHandler.loadAllData();
            this.questionBank = data.questions;

            this.dataLoaded       = true;
            this.state.usingBackend = apiHandler.backendHealthy;

            const statusEl = document.getElementById('backendStatus');
            if (!this.state.usingBackend) {
                if (statusEl) {
                    statusEl.textContent = '❌ Backend Offline. Ultra Mode Disabled.';
                    statusEl.style.color = CONFIG.COLORS.ERROR;
                }
                console.error('Backend API unavailable.');
            } else {
                if (statusEl) {
                    statusEl.textContent = '✅ Ultra Mode Ready (Backend Active)';
                    statusEl.style.color = CONFIG.COLORS.SUCCESS;
                }
            }

            if (loadingScreen) {
                setTimeout(() => loadingScreen.classList.add('hidden'), 500);
            }

            console.log('✅ Game initialized — Ultra Accuracy Mode v1.3.0');

        } catch (error) {
            console.error('Failed to initialize game:', error);
            alert(`GeoAI Ultra Mode requires a running backend. Error: ${error.message}. Switching to Welcome Screen.`);
            this.showWelcomeScreen();
        }
    }

    // ── UI Management ─────────────────────────────────────────────────────────

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    }

    showWelcomeScreen() {
        this.hideAllScreens();
        document.getElementById('welcomeScreen').classList.add('active');
    }

    showCategoryScreen() {
        this.hideAllScreens();
        document.getElementById('categoryScreen').classList.add('active');
        document.getElementById('categoryCountCountry').textContent =
            `${apiHandler.getData('country').length}+ Items • Ultra Accuracy`;
        document.getElementById('categoryCountCity').textContent =
            `${apiHandler.getData('city').length}+ Items`;
        document.getElementById('categoryCountPlace').textContent =
            `${apiHandler.getData('place').length}+ Items`;
    }

    showEngineScreen() {
        this.hideAllScreens();
        document.getElementById('engineScreen').classList.add('active');
    }

    closeEngineScreen() {
        this.showWelcomeScreen();
    }

    showThinkingScreen(category) {
        this.hideAllScreens();
        const names = { country: 'country', city: 'city', place: 'historic place' };
        document.getElementById('thinkingCategory').textContent = names[category] || category;
        document.getElementById('thinkingScreen').classList.add('active');

        const fill = document.querySelector('.thinking-progress-fill');
        if (fill) {
            fill.style.animation = 'none';
            fill.offsetHeight; // reflow
            fill.style.animation = `thinkingProgress ${this.thinkingDuration}ms ease-in-out forwards`;
        }
    }

    showQuestionScreen() {
        this.hideAllScreens();
        document.getElementById('questionScreen').classList.add('active');
        document.getElementById('questionText').textContent = 'Thinking...';
    }

    showGuessScreen() {
        this.hideAllScreens();
        document.getElementById('guessScreen').classList.add('active');
    }

    showResultScreen() {
        this.hideAllScreens();
        document.getElementById('resultScreen').classList.add('active');
        if (CONFIG.UI.ENABLE_ANIMATIONS) {
            animationController.createConfetti();
        }
    }

    showFeedbackModal(guessName) {
        document.getElementById('guessResultName').textContent = guessName;
        document.getElementById('feedbackModal').classList.add('visible');
        this.loadActualAnswers(this.state.category);
    }

    closeFeedbackModal() {
        document.getElementById('feedbackModal').classList.remove('visible');
    }

    // ── Game Flow ─────────────────────────────────────────────────────────────

    async startGame(category) {
        if (!this.dataLoaded || !this.state.usingBackend) {
            alert('Backend not ready or data loading failed. Please check console.');
            return;
        }

        this.state.category      = category;
        this.state.questionNumber = 0;
        this.state.maxConfidence  = 0;
        this.state.questions      = this.questionBank[category] || [];
        this.state.possibleItems  = apiHandler.getData(category);

        if (!this.state.questions.length || !this.state.possibleItems.length) {
            alert('No questions or data available for this category.');
            return;
        }

        this.showThinkingScreen(category);

        // ── Debug: start session tracking ─────────────────────────────────
        debugLogger.startSession(category);

        try {
            const startData = await apiHandler.startGame(category, this.state.questions);
            this.state.sessionId = startData.session_id;

            setTimeout(() => {
                this.showQuestionScreen();
                this.askNextQuestion();
            }, this.thinkingDuration);

        } catch (e) {
            console.error('Game start failed:', e);
            alert(`Failed to start game session: ${e.message}. Please check backend logs.`);
            this.showCategoryScreen();
        }
    }

    async askNextQuestion() {
        if (!this.state.sessionId) return;

        document.getElementById('questionText').style.opacity = '0.5';
        document.getElementById('typingIndicator').classList.add('active');

        try {
            const data = await apiHandler.getNextQuestion(this.state.sessionId);

            document.getElementById('typingIndicator').classList.remove('active');
            document.getElementById('questionText').style.opacity = '1';

            this.updateConfidenceUI(data.confidence, data.questions_asked);

            if (data.ready_to_guess) {
                this.showGuessScreen();
                this.makePrediction();
                return;
            }

            this.state.currentQuestion = data.question;
            this.state.questionNumber  = data.questions_asked;

            // ── Debug: log question state ──────────────────────────────────
            debugLogger.logQuestion(
                data.questions_asked,
                data.question?.question || '(no question)',
                data.top_countries    || [],
                data.confidence,
                data.active_items_count
            );

            this.updateQuestionUI(data.question);

        } catch (e) {
            console.error('Error fetching question:', e);
            document.getElementById('typingIndicator').classList.remove('active');
            document.getElementById('questionText').textContent =
                'An error occurred while fetching the next question.';
            document.getElementById('questionText').style.opacity = '1';
            this.updateConfidenceUI(0, this.state.questionNumber);
        }
    }

    async answerQuestion(answer) {
        if (!this.state.sessionId || !this.state.currentQuestion) return;

        this.state.answers.push({
            question: this.state.currentQuestion.question,
            answer
        });

        document.getElementById('questionText').style.opacity = '0.5';

        try {
            const data = await apiHandler.processAnswer(this.state.sessionId, answer);

            document.getElementById('questionText').style.opacity = '1';
            this.updateConfidenceUI(data.confidence, this.state.questionNumber);

            // ── Debug: log answer + resulting state ────────────────────────
            debugLogger.logAnswer(
                answer,
                data.top_countries    || [],
                data.confidence,
                data.active_items_count
            );

            if (data.should_stop) {
                this.showGuessScreen();
                setTimeout(() => this.makePrediction(), CONFIG.GAME.QUESTION_DELAY * 2);
                return;
            }

            setTimeout(() => this.askNextQuestion(), CONFIG.GAME.QUESTION_DELAY);

        } catch (e) {
            console.error('Error processing answer:', e);
            document.getElementById('questionText').textContent =
                'Error processing answer. Please try again.';
            document.getElementById('questionText').style.opacity = '1';
        }
    }

    // ── UI Updates ────────────────────────────────────────────────────────────

    updateQuestionUI(question) {
        const el = document.getElementById('questionText');
        el.style.opacity = '0';
        setTimeout(() => {
            el.textContent   = question.question;
            el.style.opacity = '1';
        }, 150);
    }

    updateConfidenceUI(confidence, questionsAsked) {
        this.state.maxConfidence = Math.max(this.state.maxConfidence, confidence);

        // Progress bar — based on questions asked (no hard max cap shown)
        const displayMax = Math.max(questionsAsked + 5, 20); // rolling window
        const progress   = Math.min((questionsAsked / displayMax) * 100, 100);
        document.getElementById('progressFill').style.width  = progress + '%';
        document.getElementById('progressText').textContent  =
            `Question ${questionsAsked}`;

        document.getElementById('confidenceValue').textContent = `${confidence}%`;
        document.getElementById('confidenceBar').style.width   = confidence + '%';
    }

    // ── Prediction & Feedback ─────────────────────────────────────────────────

    async makePrediction() {
        if (!this.state.sessionId) return;

        document.getElementById('guessStatus').textContent = 'Thinking... Finalizing Prediction...';
        document.getElementById('guessSpinner').classList.remove('hidden');
        document.getElementById('guessButtons').classList.add('hidden');

        try {
            const result = await apiHandler.getPrediction(this.state.sessionId);

            // ── Debug: log final guess ─────────────────────────────────────
            debugLogger.logGuess(
                result.prediction?.name || '?',
                result.confidence,
                result.questions_asked
            );

            document.getElementById('guessName').textContent       = result.prediction.name;
            document.getElementById('guessConfidence').textContent = `${result.confidence}%`;
            document.getElementById('guessInfo').textContent       = result.prediction.info;
            document.getElementById('questionsCount').textContent  = result.questions_asked;

            this.hideAllScreens();
            document.getElementById('guessScreen').classList.add('active');

            document.getElementById('guessYesBtn').onclick = () => this.handleGuess(true,  result);
            document.getElementById('guessNoBtn').onclick  = () => this.handleGuess(false, result);

            document.getElementById('guessStatus').textContent = `Is it ${result.prediction.name}?`;
            document.getElementById('guessSpinner').classList.add('hidden');
            document.getElementById('guessButtons').classList.remove('hidden');

        } catch (e) {
            console.error('Prediction failed:', e);
            alert(`Failed to make final prediction: ${e.message}`);
            this.showCategoryScreen();
        }
    }

    async handleGuess(isCorrect, result) {
        animationController.fadeOut(document.getElementById('guessScreen'), 300);

        if (isCorrect) {
            this.state.sessionId = null;
            this.showFinalResult(result);
        } else {
            this.showFeedbackModal(result.prediction.name);
        }
    }

    loadActualAnswers(category) {
        const items         = apiHandler.getData(category);
        const listContainer = document.getElementById('actualAnswerList');
        listContainer.innerHTML = '';

        items.map(i => i.name).sort().forEach(name => {
            const btn     = document.createElement('button');
            btn.className = 'btn btn-secondary btn-feedback-choice';
            btn.textContent = name;
            btn.onclick   = () => this.submitCorrection(name);
            listContainer.appendChild(btn);
        });
    }

    async submitCorrection(actualAnswerName) {
        this.closeFeedbackModal();
        this.showThinkingScreen(this.state.category);

        try {
            if (!actualAnswerName) {
                this.showQuestionScreen();
                return;
            }

            const sessionToSubmit = this.state.sessionId;
            const data = await apiHandler.submitFeedback(sessionToSubmit, actualAnswerName);
            this.state.questionNumber = data.questions_asked;

            this.thinkingDuration = 1000;
            setTimeout(() => {
                this.showQuestionScreen();
                this.askNextQuestion();
            }, 1000);

        } catch (e) {
            console.error('Correction submission failed:', e);
            alert(`Error processing correction: ${e.message}. Please start a new game.`);
            this.resetGame();
        }
    }

    // ── Final Result Display ──────────────────────────────────────────────────

    showFinalResult(result) {
        const { prediction, confidence } = result;

        document.getElementById('resultEmoji').textContent = prediction.emoji || '🎯';
        document.getElementById('resultName').textContent  = prediction.name;
        document.getElementById('resultInfo').innerHTML    = `
            <div class="info-icon">ℹ️</div>
            <p class="info-text">${prediction.info || 'No additional information available.'}</p>
        `;
        document.getElementById('finalConfidence').textContent      = confidence;
        document.getElementById('questionsAsked').textContent        = result.questions_asked;
        document.getElementById('possibleMatches').textContent       = result.remaining_items;
        document.getElementById('maxConfidenceReached').textContent  = this.state.maxConfidence;

        this.animateConfidenceCircle(confidence);
        this.showResultScreen();
    }

    animateConfidenceCircle(confidence) {
        const circle = document.getElementById('confidenceCircle');
        if (!circle) return;
        const circ   = 2 * Math.PI * 54;
        const offset = circ - (confidence / 100) * circ;
        circle.style.strokeDasharray  = circ;
        circle.style.strokeDashoffset = circ;
        setTimeout(() => { circle.style.strokeDashoffset = offset; }, 100);
    }

    // ── Utility ───────────────────────────────────────────────────────────────

    playAgain() {
        if (this.state.category) this.startGame(this.state.category);
        else this.showCategoryScreen();
    }

    resetGame() {
        this.state.sessionId = null;
        this.state = {
            category: null, currentQuestion: null, questionNumber: 0,
            maxQuestions: CONFIG.GAME.MAX_QUESTIONS, askedQuestions: [],
            possibleItems: [], answers: [], questions: null,
            usingBackend: false, sessionId: null, maxConfidence: 0
        };
        this.showWelcomeScreen();
    }
}

const game = new Game();
