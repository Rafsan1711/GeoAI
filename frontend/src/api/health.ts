import client from './client';

export interface HealthDetailedResponse {
  status: string;
  version: string;
  engine: string;
  data_stats: Record<string, { count: number }>;
  total_places: number;
  total_questions: number;
  latest_accuracy: number | null;
}

export const getDetailedHealth = async (): Promise<HealthDetailedResponse> => {
  const { data } = await client.get<HealthDetailedResponse>('/health/detailed');
  return data;
};
