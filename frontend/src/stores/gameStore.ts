import { create } from 'zustand';
import { PlaceOut, Question, TopCandidate, Answer, Prediction } from '../types';
import * as gameApi from '../api/game';
import toast from 'react-hot-toast';

type GamePhase = 'idle' | 'loading' | 'questioning' | 'thinking' | 'predicting' | 'result' | 'feedback' | 'correct' | 'incorrect';

interface GameState {
  sessionId: string | null;
  phase: GamePhase;
  questions_asked: number;
  confidence: number;
  active_count: number;
  current_question: Question | null;
  prediction: Prediction | null;
  alternatives: PlaceOut[];
  error: string | null;

  startGame: (place_type?: string) => Promise<void>;
  submitAnswer: (answer: Answer) => Promise<void>;
  requestPrediction: () => Promise<void>;
  submitFeedback: (place_name?: string, place_id?: string) => Promise<void>;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  sessionId: null,
  phase: 'idle',
  questions_asked: 0,
  confidence: 0,
  active_count: 0,
  current_question: null,
  prediction: null,
  alternatives: [],
  error: null,

  startGame: async (place_type?: string) => {
    set({ phase: 'loading', error: null });
    try {
      const res = await gameApi.startGame(place_type);
      
      const qRes = await gameApi.getQuestion(res.session_id);
      
      set({
        sessionId: res.session_id,
        current_question: qRes.question || null,
        questions_asked: qRes.questions_asked,
        confidence: (qRes.confidence || 0) * 100,
        active_count: qRes.active_places_count || 0,
        phase: 'questioning',
      });
      toast.success('Game started!');
    } catch (error: any) {
      set({ error: error.message || 'Failed to start game.', phase: 'idle' });
      toast.error('Backend unavailable');
    }
  },

  submitAnswer: async (answer: Answer) => {
    const { sessionId } = get();
    if (!sessionId) return;
    
    set({ phase: 'thinking', error: null });
    toast.success('Answer submitted', { id: 'answer', duration: 1000, style: { fontSize: '14px', padding: '8px' } });
    
    try {
      const res = await gameApi.submitAnswer(sessionId, answer);
      
      if (res.should_stop) {
        set({ 
          active_count: res.active_places_count || 0,
          confidence: (res.confidence || 0) * 100,
          phase: 'predicting' 
        });
        
        await get().requestPrediction();
      } else {
        const qRes = await gameApi.getQuestion(sessionId);
        set({
          current_question: qRes.question || null,
          phase: 'questioning',
          questions_asked: qRes.questions_asked,
          active_count: qRes.active_places_count || 0,
          confidence: (qRes.confidence || 0) * 100,
        });
      }
    } catch (error: any) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail || '';
      
      // Session not found = backend worker routing issue
      // Show clear message, let user restart cleanly
      if (status === 400 && detail.toLowerCase().includes('session')) {
        set({ 
          error: 'Game session lost due to server restart. Please start a new game.',
          phase: 'idle',
          sessionId: null,
          current_question: null,
          questions_asked: 0,
          confidence: 0,
          active_count: 0,
        });
        toast.error('Server restarted — please start a new game', { duration: 5000 });
      } else {
        set({ error: error.message || 'Failed to submit answer.', phase: 'questioning' });
        toast.error('Something went wrong. Try again.');
      }
    }
  },

  requestPrediction: async () => {
    const { sessionId } = get();
    if (!sessionId) return;
    
    set({ phase: 'predicting', error: null });
    
    try {
      const res = await gameApi.getPrediction(sessionId);
      set({
        prediction: res.prediction ? { ...res.prediction, confidence: (res.confidence || 0) * 100 } : null,
        alternatives: res.alternatives || [],
        phase: 'result'
      });
    } catch (error: any) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail || '';

      if (status === 400 && detail.toLowerCase().includes('session')) {
        set({ 
          error: 'Game session lost due to server restart. Please start a new game.',
          phase: 'idle',
          sessionId: null,
          current_question: null,
          questions_asked: 0,
          confidence: 0,
          active_count: 0,
        });
        toast.error('Server restarted — please start a new game', { duration: 5000 });
      } else {
        set({ error: error.message || 'Failed to get prediction.', phase: 'questioning' });
        toast.error('Something went wrong. Try again.');
      }
    }
  },

  submitFeedback: async (place_name?: string, place_id?: string) => {
    const { sessionId } = get();
    if (!sessionId) return;
    
    set({ phase: 'loading', error: null });
    
    try {
      await gameApi.submitFeedback(sessionId, place_name, place_id);
      set({ phase: 'incorrect' });
      toast.success('Atlas is learning from your correction');
    } catch (error: any) {
      const isSessionError = error.response?.status === 400 || error.message?.includes('400');
      const errorMessage = isSessionError 
        ? 'Session expired. Please restart the game.' 
        : (error.message || 'Failed to submit feedback.');
        
      set({ error: errorMessage, phase: 'feedback' });
      toast.error(errorMessage);
    }
  },

  resetGame: () => {
    set({
      sessionId: null,
      phase: 'idle',
      questions_asked: 0,
      confidence: 0,
      active_count: 0,
      current_question: null,
      prediction: null,
      alternatives: [],
      error: null,
    });
  }
}));
