import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

// API Methods
export const fixturesApi = {
    getLiveFixtures: async () => {
        try {
            const response = await apiClient.get('/fixtures/live');
            return response.data;
        } catch (error) {
            console.error("Error fetching live fixtures:", error);
            throw error;
        }
    },

    getTodayFixtures: async () => {
        try {
            const response = await apiClient.get('/fixtures/today');
            return response.data;
        } catch (error) {
            console.error("Error fetching today's fixtures:", error);
            throw error;
        }
    },

    // Stream live matches using Server Sent Events (SSE)
    streamLiveFixtures: (onMessage, onError) => {
        const eventSource = new EventSource(`${API_BASE_URL}/fixtures/stream`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            onMessage(data);
        }

        eventSource.onerror = (error) => {
            console.error('Stream error:', error);
            if (onError) onError(error);
        };

        return () => eventSource.close();
    },
};

export default apiClient;
