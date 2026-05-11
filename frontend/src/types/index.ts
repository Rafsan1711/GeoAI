export interface GameSession {
  sessionId: string;
  startedAt: string;
  status: 'playing' | 'completed' | 'abandoned';
  score?: number;
}

export interface Question {
  question_text: string;
  attribute: string;
  value: any;
  stage: number;
}

export enum Answer {
  YES = 'yes',
  PROBABLY = 'probably',
  DONT_KNOW = 'dontknow',
  PROBABLY_NOT = 'probablynot',
  NO = 'no'
}

export interface TopCandidate {
  name: string;
  emoji?: string;
  probability: number;
}

export interface Prediction extends PlaceOut {
  confidence: number;
}

export interface PlaceOut {
  id: string;
  name: string;
  type?: string;
  emoji?: string;
  description?: string;
  fun_fact?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface StartGameResponse {
  session_id: string;
  total_places: number;
  message: string;
}

export interface QuestionResponse {
  question?: Question | null;
  ready_to_guess: boolean;
  confidence: number;
  questions_asked: number;
  active_places_count: number;
  top_candidates: TopCandidate[];
}

export interface AnswerResponse {
  confidence: number;
  questions_asked: number;
  active_places_count: number;
  should_stop: boolean;
  top_candidates: TopCandidate[];
}

export interface PredictionResponse {
  prediction?: PlaceOut | null;
  confidence: number;
  alternatives: PlaceOut[];
  questions_asked: number;
  total_places: number;
}

export interface FeedbackResponse {
  status: string;
  message: string;
}

export interface AdminStats {
  totalGames: number;
  averageAccuracy: number;
  totalPredictions: number;
}

export interface AccuracyDay {
  date: string;
  accuracy: number;
  gamesPlayed: number;
}

export interface AtlasMindCheckResult {
  status: 'healthy' | 'degraded' | 'offline';
  latency: number;
  lastSync: string;
}
