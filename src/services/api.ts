import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Type definitions
export interface Fixture {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  statusShort: string;
  elapsed: number;
  leagueName: string;
  country: string;
  live: boolean;
}

// API Methods
export const fixturesApi = {
    getLiveFixtures: async (): Promise<Fixture[]> => {
        try {
            const response = await apiClient.get<Fixture[]>('/fixtures/live');
            return response.data;
        } catch (error) {
            console.error("Error fetching live fixtures:", error);
            throw error;
        }
    },

    getTodayFixtures: async (): Promise<Fixture[]> => {
        try {
            const response = await apiClient.get<Fixture[]>('/fixtures/today');
            return response.data;
        } catch (error) {
            console.error("Error fetching today's fixtures:", error);
            throw error;
        }
    },

    // Stream live matches using Server Sent Events (SSE)
    streamLiveFixtures: (
      onMessage: (data: Fixture[]) => void,
       onError?: (error: Event) => void
    ): (() => void) => {
      const eventSource = new EventSource(`${API_BASE_URL}/fixtures/stream`, {
            withCredentials: true
      }); 
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            onMessage(data);
          } catch (err) {
            console.error('Error parsing SSE data:', err);
            if (onError) onError(err as Event);
          }  
        };

        eventSource.onerror = (error: Event) => {
            console.error('Stream error:', error);
            eventSource.close();
            if (onError) onError(error);
        };

        return () => eventSource.close();
    },
};

export default apiClient;
