/**
 * debug.js — GeoAI Debug Logger
 *
 * Captures per-question state during a game session and generates
 * a detailed Markdown report downloadable via Shift+D+L.
 *
 * Usage:
 *   debugLogger.startSession(category)
 *   debugLogger.logQuestion(qNum, questionText, topCountries, confidence, activeCount)
 *   debugLogger.logAnswer(answer, topCountries, confidence, activeCount)
 *   debugLogger.logGuess(predictedName, confidence, questionsAsked)
 *   debugLogger.download()          ← called automatically by Shift+D+L
 */

class DebugLogger {
    constructor() {
        this.reset();
        this._bindHotkey();
    }

    reset() {
        this.category   = '';
        this.startedAt  = null;
        this.entries    = [];   // array of step objects
        this._pending   = null; // question step waiting for answer
    }

    // ── Session lifecycle ────────────────────────────────────────────────────

    startSession(category) {
        this.reset();
        this.category  = category;
        this.startedAt = new Date();
        console.log('[Debug] Session started:', category);
    }

    // ── Per-question logging ─────────────────────────────────────────────────

    /**
     * Call this RIGHT AFTER getting /api/question response.
     * @param {number}   qNum         - question number (1-based)
     * @param {string}   questionText - the question string shown to user
     * @param {Array}    topCountries - [{name, prob}, …] top-10 from API
     * @param {number}   confidence   - confidence% from API
     * @param {number}   activeCount  - active items count from API
     */
    logQuestion(qNum, questionText, topCountries, confidence, activeCount) {
        // Save pending — will be completed when answer arrives
        this._pending = {
            qNum,
            question:     questionText,
            topBefore:    topCountries || [],
            confBefore:   confidence,
            activeBefore: activeCount,
            answer:       null,
            topAfter:     null,
            confAfter:    null,
            activeAfter:  null,
        };
    }

    /**
     * Call this RIGHT AFTER getting /api/answer response.
     * @param {string} answer        - 'yes'|'no'|'probably'|'probablynot'|'dontknow'
     * @param {Array}  topCountries  - [{name, prob}, …] top-10 from API
     * @param {number} confidence    - confidence% after answer
     * @param {number} activeCount   - active items count after answer
     */
    logAnswer(answer, topCountries, confidence, activeCount) {
        if (!this._pending) return;
        this._pending.answer      = answer;
        this._pending.topAfter    = topCountries || [];
        this._pending.confAfter   = confidence;
        this._pending.activeAfter = activeCount;
        this.entries.push({ ...this._pending });
        this._pending = null;
    }

    /**
     * Call when the AI makes its final guess.
     */
    logGuess(predictedName, confidence, questionsAsked) {
        this.entries.push({
            type:           'GUESS',
            predictedName,
            confidence,
            questionsAsked,
        });
    }

    // ── Markdown generation ──────────────────────────────────────────────────

    generateMarkdown() {
        const now      = new Date();
        const duration = this.startedAt
            ? Math.round((now - this.startedAt) / 1000)
            : 0;

        const lines = [];

        // Header
        lines.push(`# GeoAI Debug Report`);
        lines.push(``);
        lines.push(`| Field | Value |`);
        lines.push(`|-------|-------|`);
        lines.push(`| Category | ${this.category} |`);
        lines.push(`| Started | ${this.startedAt ? this.startedAt.toLocaleTimeString() : '—'} |`);
        lines.push(`| Generated | ${now.toLocaleTimeString()} |`);
        lines.push(`| Duration | ${duration}s |`);
        lines.push(`| Total Steps | ${this.entries.length} |`);
        lines.push(``);
        lines.push(`---`);
        lines.push(``);

        // Steps
        this.entries.forEach((entry, idx) => {
            if (entry.type === 'GUESS') {
                lines.push(`## 🎯 Final Guess`);
                lines.push(``);
                lines.push(`| | |`);
                lines.push(`|--|--|`);
                lines.push(`| Predicted | **${entry.predictedName}** |`);
                lines.push(`| Confidence | ${entry.confidence}% |`);
                lines.push(`| Questions Asked | ${entry.questionsAsked} |`);
                lines.push(``);
                return;
            }

            const answerEmoji = {
                yes:         '✅ Yes',
                probably:    '🟡 Probably',
                dontknow:    '❓ Don\'t Know',
                probablynot: '🟠 Probably Not',
                no:          '❌ No',
            }[entry.answer] || entry.answer;

            lines.push(`## Q${entry.qNum}: ${entry.question}`);
            lines.push(``);
            lines.push(`**Answer:** ${answerEmoji}`);
            lines.push(``);

            // Confidence change
            const confDelta = entry.confAfter !== null
                ? (entry.confAfter - entry.confBefore).toFixed(1)
                : null;
            const confArrow = confDelta > 0 ? '📈' : confDelta < 0 ? '📉' : '➡️';
            lines.push(`**Confidence:** ${entry.confBefore}% → ${entry.confAfter ?? '?'}% ${confArrow} (${confDelta > 0 ? '+' : ''}${confDelta ?? '?'})`);
            lines.push(``);

            // Active items change
            lines.push(`**Active Countries:** ${entry.activeBefore} → ${entry.activeAfter ?? '?'}`);
            lines.push(``);

            // Top countries before
            lines.push(`### Before Answer — Top ${entry.topBefore.length} Candidates`);
            lines.push(``);
            lines.push(`| Rank | Country | Probability |`);
            lines.push(`|------|---------|-------------|`);
            entry.topBefore.forEach((c, i) => {
                lines.push(`| ${i + 1} | ${c.name} | ${c.prob}% |`);
            });
            lines.push(``);

            // Top countries after
            if (entry.topAfter && entry.topAfter.length) {
                lines.push(`### After Answer — Top ${entry.topAfter.length} Candidates`);
                lines.push(``);
                lines.push(`| Rank | Country | Probability | Change |`);
                lines.push(`|------|---------|-------------|--------|`);

                const beforeMap = {};
                entry.topBefore.forEach(c => { beforeMap[c.name] = c.prob; });

                entry.topAfter.forEach((c, i) => {
                    const prev   = beforeMap[c.name];
                    const delta  = prev !== undefined ? (c.prob - prev).toFixed(2) : 'new';
                    const arrow  = delta === 'new' ? '🆕'
                        : parseFloat(delta) > 0  ? `+${delta}% 📈`
                        : parseFloat(delta) < 0  ? `${delta}% 📉`
                        : `±0%`;
                    lines.push(`| ${i + 1} | ${c.name} | ${c.prob}% | ${arrow} |`);
                });
                lines.push(``);
            }

            lines.push(`---`);
            lines.push(``);
        });

        if (this.entries.length === 0) {
            lines.push(`> ⚠️ No game data captured yet. Play a game first.`);
        }

        return lines.join('\n');
    }

    // ── Download ─────────────────────────────────────────────────────────────

    download() {
        const md       = this.generateMarkdown();
        const blob     = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const url      = URL.createObjectURL(blob);
        const ts       = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `geoai-debug-${this.category || 'unknown'}-${ts}.md`;

        const a    = document.createElement('a');
        a.href     = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`[Debug] Downloaded: ${filename}`);
        this._showToast(`📥 Debug log downloaded: ${filename}`);
    }

    // ── Hotkey: Shift+D+L ────────────────────────────────────────────────────

    _bindHotkey() {
        const pressed = new Set();
        document.addEventListener('keydown', (e) => {
            pressed.add(e.key.toLowerCase());
            // Shift+D+L
            if (e.shiftKey && pressed.has('d') && pressed.has('l')) {
                e.preventDefault();
                this.download();
            }
        });
        document.addEventListener('keyup', (e) => {
            pressed.delete(e.key.toLowerCase());
        });
    }

    // ── Toast notification ───────────────────────────────────────────────────

    _showToast(message) {
        const existing = document.getElementById('debugToast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id    = 'debugToast';
        toast.style.cssText = `
            position: fixed; bottom: 24px; right: 24px; z-index: 99999;
            background: #1e293b; color: #f8fafc; padding: 12px 20px;
            border-radius: 10px; font-size: 14px; font-family: monospace;
            border-left: 4px solid #6366f1; box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;

        // Inject keyframe if not already present
        if (!document.getElementById('debugToastStyle')) {
            const style = document.createElement('style');
            style.id    = 'debugToastStyle';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateY(20px); opacity: 0; }
                    to   { transform: translateY(0);    opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }
}

// Global singleton
const debugLogger = new DebugLogger();
