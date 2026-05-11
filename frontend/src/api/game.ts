import client from './client';
import { StartGameResponse, QuestionResponse, AnswerResponse, PredictionResponse, FeedbackResponse, Answer } from '../types';

export const startGame = async (place_type?: string): Promise<StartGameResponse> => {
  const { data } = await client.post<StartGameResponse>('/api/v2/game/start', { place_type });
  return data;
};

export const getQuestion = async (session_id: string): Promise<QuestionResponse> => {
  const { data } = await client.post<QuestionResponse>('/api/v2/game/question', { session_id });
  return data;
};

export const submitAnswer = async (session_id: string, answer: Answer): Promise<AnswerResponse> => {
  const { data } = await client.post<AnswerResponse>('/api/v2/game/answer', { session_id, answer });
  return data;
};

export const getPrediction = async (session_id: string): Promise<PredictionResponse> => {
  const { data } = await client.post<PredictionResponse>('/api/v2/game/predict', { session_id });
  return data;
};

export const submitFeedback = async (session_id: string, place_name?: string, place_id?: string): Promise<FeedbackResponse> => {
  const { data } = await client.post<FeedbackResponse>('/api/v2/game/feedback', { 
    session_id, 
    actual_place_name: place_name, 
    actual_place_id: place_id 
  });
  return data;
};
