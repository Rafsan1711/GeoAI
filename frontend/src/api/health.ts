import client from './client';

export interface HealthDetailedResponse {
  engine: string;
  status: string;
  version: string;
  data_stats: {
    city: { count: number };
    country: { count: number };
    place: { count: number };
  };
}

export const getDetailedHealth = async (): Promise<HealthDetailedResponse> => {
  const { data } = await client.get<HealthDetailedResponse>('/health');
  return data;
};
