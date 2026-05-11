import axios from 'axios';
import { API_BASE_URL } from '../lib/constants';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error.response?.data?.detail;
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      detail: detail,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      // Clear admin auth state when unauthorized
      console.warn('Unauthorized access. Clearing admin auth state.');
      // NOTE: This will be connected to the Zustand store once it's implemented.
      // e.g., useAdminStore.getState().logout();
    }
    
    return Promise.reject(error);
  }
);

export default client;
