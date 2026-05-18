import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Check, ChevronRight, MessageCircle, RefreshCw, X, Search } from 'lucide-react';
import confetti from 'canvas-confetti';

import { PageWrapper } from '../components/layout';
import { useGameStore } from '../stores/gameStore';
import { Answer } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { AtlasCharacter, AtlasBubble, AtlasThinking, AtlasConfidence } from '../components/atlas';
import { cn } from '../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getDetailedHealth } from '../api/health';

// Animations
const fadeAnim = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3 }
};

export default function Game() {
  const { 
    phase, 
    confidence, 
    active_count,
    questions_asked, 
    current_question, 
    prediction,
    alternatives,
    startGame, 
    submitAnswer, 
    submitFeedback,
    resetGame,
    error 
  } = useGameStore();

  const navigate = useNavigate();
  const { data: healthData } = useQuery({
    queryKey: ['health', 'detailed'],
    queryFn: getDetailedHealth,
    staleTime: 5 * 60 * 1000,
  });

  const placesCount = healthData 
    ? (healthData.data_stats?.country?.count || 0) + 
      (healthData.data_stats?.city?.count || 0) + 
      (healthData.data_stats?.place?.count || 0)
    : '--';

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'r' || e.key === 'R') {
        if (window.confirm('Are you sure you want to restart the game?')) {
          resetGame();
        }
      }
      
      if (e.key === 'Escape') {
        if (phase !== 'idle' && phase !== 'correct' && phase !== 'result') {
          if (window.confirm('Are you sure you want to abandon this game and go home?')) {
             resetGame();
             navigate('/');
          }
        } else if (phase === 'idle') {
           navigate('/');
        }
      }

      if (phase !== 'questioning') return;
      switch (e.key) {
        case '1': submitAnswer(Answer.YES); break;
        case '2': submitAnswer(Answer.PROBABLY); break;
        case '3': submitAnswer(Answer.DONT_KNOW); break;
        case '4': submitAnswer(Answer.PROBABLY_NOT); break;
        case '5': submitAnswer(Answer.NO); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, submitAnswer, resetGame, navigate]);

  const fireConfetti = () => {
    const duration = 2 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      // launch a few confetti from the left edge
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00C2FF', '#00E5A0']
      });
      // and launch a few from the right edge
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#00C2FF', '#00E5A0']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  useEffect(() => {
    if (phase === 'correct') {
      fireConfetti();
    }
  }, [phase]);

  const handleCorrect = () => {
    useGameStore.setState({ phase: 'correct' });
  };

  const handleIncorrect = () => {
    useGameStore.setState({ phase: 'feedback' });
  };

  const AnswerButton = ({ answer, label, index, colorClass }: { answer: Answer, label: string, index: number, colorClass: string }) => (
    <motion.div
      whileHover={phase === 'thinking' ? {} : { scale: 1.015, y: -2 }}
      whileTap={phase === 'thinking' ? {} : { scale: 0.98 }}
      className="w-full relative"
    >
      <Button
        variant="outline"
        aria-label={`Answer ${label} (Shortcut: ${index})`}
        className={cn("w-full h-16 justify-between px-6 md:px-8 border hover:text-text-primary text-text-primary group transition-all duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080C14] rounded-2xl shadow-sm", colorClass, phase === 'thinking' ? 'opacity-50 cursor-not-allowed grayscale' : '')}
        onClick={() => submitAnswer(answer)}
        disabled={phase === 'thinking'}
      >
        <span className="font-bold text-base sm:text-lg">{label}</span>
        <Badge variant="outline" className="opacity-40 group-hover:opacity-100 transition-opacity bg-[#080C14] border-none w-7 h-7 flex items-center justify-center p-0 rounded-md shadow-inner text-sm">{index}</Badge>
      </Button>
    </motion.div>
  );

  return (
    <PageWrapper>
      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          
          {/* ━━━ IDLE STATE (START SCREEN) ━━━ */}
          {phase === 'idle' && (
            <motion.div key="idle" {...fadeAnim} className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full py-12">
              <div className="relative mb-12">
                <AtlasBubble message="Ready to test me? Think of any place on Earth." typing={true} />
                <div className="flex justify-center mt-6">
                  <AtlasCharacter size="xl" showLabel={true} />
                </div>
              </div>
              
              <div className="w-full space-y-4">
                <p className="text-text-secondary text-sm font-medium uppercase tracking-wider text-center mb-4">Choose a category:</p>
                
                <button 
                  onClick={() => startGame('country')}
                  className="w-full group relative bg-bg-surface border-2 border-accent-cyan/50 hover:border-accent-cyan rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,194,255,0.15)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan/10 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-in-out" />
                  <div className="relative flex items-center justify-between z-10">
                    <div className="flex items-center space-x-4">
                      <span className="text-4xl group-hover:scale-110 transition-transform origin-center">🌍</span>
                      <div>
                        <h3 className="text-xl font-bold text-text-primary">Countries</h3>
                        <p className="text-text-secondary text-sm">{healthData?.data_stats?.country?.count !== undefined ? `${healthData.data_stats.country.count} places` : '193 places'}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-accent-cyan opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all" />
                  </div>
                </button>

                {/* Coming Soon Category */}
                <div className="w-full bg-bg-base border border-border-subtle rounded-2xl p-6 text-left opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 grayscale opacity-80">
                      <span className="text-4xl">🏙️</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-xl font-bold text-text-muted">Cities & Landmarks</h3>
                          <Badge variant="amber" className="bg-accent-amber/10 text-accent-amber/80 border-none px-2 py-0">Coming Soon</Badge>
                        </div>
                        <p className="text-text-muted text-sm">We're building this dataset</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-border-subtle">
                  <details className="group">
                    <summary className="flex items-center cursor-pointer text-text-secondary hover:text-text-primary text-sm font-medium select-none">
                      <ChevronRight className="w-4 h-4 mr-2 transition-transform group-open:rotate-90" />
                      How to play
                    </summary>
                    <p className="mt-4 text-text-muted text-sm leading-relaxed pl-6">
                      Think of a country. Answer Yes/Probably/Don't Know/Probably Not/No to each question.
                      Atlas uses each answer to narrow down possibilities using Bayesian inference. 
                      Try to stump Atlas!
                    </p>
                  </details>
                </div>
              </div>
            </motion.div>
          )}

          {/* ━━━ QUESTIONING / THINKING STATE ━━━ */}
          {(phase === 'questioning' || phase === 'thinking' || phase === 'predicting' || phase === 'loading') && (
            <motion.div key="game" {...fadeAnim} className="flex-1 flex flex-col w-full max-w-[640px] mx-auto h-full justify-center">
              
              {/* MAIN QUESTION AREA */}
              <div className="flex flex-col w-full">
                <div className="flex flex-col space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <motion.div 
                      key={questions_asked}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="font-mono text-text-primary opacity-80 font-bold tracking-widest uppercase text-sm"
                    >
                      Question {questions_asked}
                    </motion.div>
                  </div>
                  {/* Full width confidence bar */}
                  <div className="w-full h-2 overflow-hidden rounded-full bg-border-strong relative shadow-inner">
                    <Progress value={confidence} className="h-full rounded-full transition-all duration-700 ease-out" indicatorClassName={confidence > 80 ? 'bg-accent-green' : confidence > 50 ? 'bg-accent-cyan' : 'bg-accent-amber'} />
                  </div>
                </div>
                
                <motion.div 
                  initial={{ boxShadow: '0 0 0 rgba(0,0,0,0)' }}
                  animate={{ boxShadow: '0 10px 40px -10px rgba(0, 194, 255, 0.08)' }}
                  className="bg-bg-surface/80 backdrop-blur-md border border-border/80 rounded-[2.5rem] p-6 sm:p-8 md:p-12 mb-8 flex flex-col justify-center items-center relative min-h-[220px]"
                >
                  {error && (
                    <div className="absolute top-4 left-4 right-4 bg-accent-red/10 border border-accent-red/30 text-accent-red px-4 py-2 rounded-lg text-sm text-center">
                      {error}
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    {(phase === 'thinking' || phase === 'predicting' || phase === 'loading') ? (
                       <motion.div key="thinking" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center">
                         <AtlasThinking />
                         <span className="text-text-muted mt-4 font-mono text-sm animate-pulse">Processing your answer...</span>
                       </motion.div>
                    ) : (
                      <motion.div key={current_question?.question_text || 'empty'} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full flex justify-start items-end space-x-4 px-2 sm:px-6">
                         <div className="flex-shrink-0">
                           <AtlasCharacter size="lg" showLabel={false} animate={true} />
                         </div>
                         {current_question && (
                            <AtlasBubble 
                              message={current_question.question_text} 
                              side="right" 
                              typing={false} 
                              className="max-w-[85%] md:max-w-md p-5 md:p-6 bg-accent-cyan/5 border-accent-cyan/20 shadow-xl"
                              textClassName="text-lg md:text-xl font-medium"
                            />
                         )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div 
                  className="flex flex-col space-y-3 mb-8"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.1 }
                    }
                  }}
                >
                  <motion.div variants={fadeAnim}><AnswerButton answer={Answer.YES} label="Yes" index={1} colorClass="bg-accent-green/5 border-accent-green/30 hover:bg-accent-green/10 hover:border-accent-green focus-visible:ring-accent-green hover:shadow-[0_0_20px_rgba(0,229,160,0.15)]" /></motion.div>
                  <motion.div variants={fadeAnim}><AnswerButton answer={Answer.PROBABLY} label="Probably" index={2} colorClass="bg-accent-cyan/5 border-accent-cyan/30 hover:bg-accent-cyan/10 hover:border-accent-cyan focus-visible:ring-accent-cyan hover:shadow-[0_0_20px_rgba(0,194,255,0.15)]" /></motion.div>
                  <motion.div variants={fadeAnim}><AnswerButton answer={Answer.DONT_KNOW} label="I Don't Know" index={3} colorClass="bg-bg-surface border-border-strong hover:bg-bg-elevated hover:border-border focus-visible:ring-white hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]" /></motion.div>
                  <motion.div variants={fadeAnim}><AnswerButton answer={Answer.PROBABLY_NOT} label="Probably Not" index={4} colorClass="bg-accent-amber/5 border-accent-amber/30 hover:bg-accent-amber/10 hover:border-accent-amber focus-visible:ring-accent-amber hover:shadow-[0_0_20px_rgba(255,184,0,0.15)]" /></motion.div>
                  <motion.div variants={fadeAnim}><AnswerButton answer={Answer.NO} label="No" index={5} colorClass="bg-accent-red/5 border-accent-red/30 hover:bg-accent-red/10 hover:border-accent-red focus-visible:ring-accent-red hover:shadow-[0_0_20px_rgba(255,71,87,0.15)]" /></motion.div>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center w-full"
                >
                  <span className={cn(
                    "font-mono text-sm font-medium transition-colors duration-500",
                    active_count <= 2 ? "text-accent-green" : active_count <= 5 ? "text-accent-amber" : "text-text-muted"
                  )}>
                    {active_count > 0 
                      ? (active_count <= 2 ? "Getting very close..." : active_count <= 5 ? `Only ${active_count} places left...` : `Atlas is considering ${active_count} places`)
                      : "Gathering intel..."}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ━━━ RESULT STATE ━━━ */}
          {phase === 'result' && prediction && (
            <motion.div key="result" {...fadeAnim} className="flex-1 flex flex-col items-center justify-center p-4">
              <div className="bg-bg-surface border border-border-subtle rounded-3xl p-8 md:p-12 max-w-2xl w-full text-center shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-accent-cyan/5 to-transparent pointer-events-none" />
                
                <p className="text-text-muted uppercase tracking-wider font-mono text-sm mb-6 relative z-10">Atlas thinks it's...</p>
                
                <motion.div 
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="text-8xl mb-6 relative z-10 select-none"
                >
                  {prediction.emoji || '🗺️'}
                </motion.div>
                
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl md:text-5xl font-black font-sans mb-3 text-text-primary relative z-10"
                >
                  {prediction.name}
                </motion.h1>

                <Badge variant="outline" className="mb-8 relative z-10">Country</Badge>

                {prediction.description && (
                  <p className="text-text-secondary mb-8 max-w-lg mx-auto relative z-10">
                    {prediction.description}
                  </p>
                )}

                <div className="flex justify-center mb-10 relative z-10">
                  <div className="bg-bg-base border border-border-subtle p-4 rounded-2xl flex items-center space-x-6">
                    <AtlasConfidence confidence={prediction.confidence} questionsAsked={questions_asked} />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                  <Button size="lg" className="flex-1 bg-accent-green text-[#080C14] hover:bg-accent-green/80 border-none" onClick={handleCorrect}>
                    <Check className="w-5 h-5 mr-2" /> Yes, that's right!
                  </Button>
                  <Button size="lg" variant="outline" className="flex-1 border-accent-red/50 text-accent-red hover:bg-accent-red hover:text-white" onClick={handleIncorrect}>
                    <X className="w-5 h-5 mr-2" /> No, that's wrong
                  </Button>
                </div>
              </div>

              {alternatives.length > 0 && (
                <div className="mt-8 text-center max-w-2xl w-full">
                  <p className="text-text-muted text-sm mb-4">Alternatives Atlas considered:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {alternatives.slice(0, 3).map((alt) => (
                      <Badge key={alt.id} variant="default" className="text-xs py-1.5 px-3 bg-bg-surface">
                        <span className="mr-2">{alt.emoji || '🏳️'}</span> {alt.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ━━━ CORRECT STATE ━━━ */}
          {phase === 'correct' && prediction && (
            <motion.div key="correct" {...fadeAnim} className="flex-1 flex flex-col items-center justify-center p-4">
              <div className="relative mb-12">
                <AtlasBubble message="I got it! I love geography 🌍" typing={true} />
                <div className="flex justify-center mt-6 relative">
                  <div className="absolute inset-0 bg-accent-green/20 blur-[60px] rounded-full" />
                  <AtlasCharacter size="xl" showLabel={false} animate={true} />
                </div>
              </div>
              
              <h2 className="text-4xl sm:text-6xl font-black text-accent-green mb-6 text-center">Atlas Got It!</h2>
              <div className="font-mono text-text-secondary mb-12 text-center bg-bg-surface p-4 rounded-xl border border-border-subtle">
                Solved in <span className="text-text-primary text-xl">{questions_asked}</span> questions
                <span className="mx-4">|</span>
                <span className="text-accent-cyan text-xl">{prediction.confidence}%</span> confidence
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => resetGame()}>
                  <RefreshCw className="mr-2 w-5 h-5" /> Play Again
                </Button>
              </div>
            </motion.div>
          )}

          {/* ━━━ FEEDBACK STATE ━━━ */}
          {phase === 'feedback' && (
            <motion.div key="feedback" {...fadeAnim} className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full">
               <div className="relative mb-12 self-center">
                 <AtlasBubble message="Oops! Help me learn — what were you thinking of?" typing={true} />
                 <div className="flex justify-center mt-6">
                    <AtlasCharacter size="lg" showLabel={false} animate={true} />
                 </div>
               </div>

               <div className="bg-bg-surface border border-border-subtle p-6 rounded-2xl w-full">
                  {error && (
                    <div className="mb-4 text-accent-red text-sm bg-accent-red/10 p-3 rounded-lg">{error}</div>
                  )}
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    submitFeedback(formData.get('place_name') as string);
                  }} className="flex flex-col gap-4">
                     <label className="text-sm font-medium text-text-secondary">Type the place name:</label>
                     <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                       <input 
                         name="place_name"
                         type="text" 
                         className="w-full bg-[#080C14] border border-border rounded-xl pl-10 pr-4 py-3 text-text-primary focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan"
                         placeholder="e.g. France, Eiffel Tower, Amazon River..."
                         required
                       />
                     </div>
                     <p className="text-xs text-text-muted mt-2">
                       Not in my database yet? We'll add it soon via AtlasMind.
                     </p>
                     
                     <div className="mt-6 flex gap-3">
                       <Button type="button" variant="ghost" className="flex-1" onClick={() => resetGame()}>Cancel</Button>
                       <Button type="submit" className="flex-1">Submit</Button>
                     </div>
                  </form>
               </div>
            </motion.div>
          )}

          {/* ━━━ INCORRECT/LEARNING STATE ━━━ */}
          {phase === 'incorrect' && (
            <motion.div key="incorrect" {...fadeAnim} className="flex-1 flex flex-col items-center justify-center p-4">
              <div className="relative mb-12">
                <AtlasBubble message="Thanks! I'm recalibrating... I will remember this for next time." typing={true} />
                <div className="flex justify-center mt-6 relative">
                  <div className="absolute inset-0 bg-accent-amber/10 blur-[60px] rounded-full" />
                  <AtlasCharacter size="xl" showLabel={false} animate={true} />
                </div>
              </div>
              <div className="mt-12">
                <Button size="lg" onClick={() => resetGame()}>
                  <RefreshCw className="mr-2 w-5 h-5" /> Play Again
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}
