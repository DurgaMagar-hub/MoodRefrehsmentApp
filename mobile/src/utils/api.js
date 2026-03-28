import axios from 'axios';
import { API_URL, FALLBACK_URLS } from '../config';

// Create axios instance with default config
const api = axios.create({
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add base URL
api.interceptors.request.use(
    (config) => {
        config.baseURL = API_URL;
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor with fallback logic
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the request fails and we haven't tried fallbacks yet
        if (!originalRequest._retry && originalRequest._retryCount === undefined) {
            originalRequest._retry = true;
            originalRequest._retryCount = 0;

            // Try each fallback URL
            for (const fallbackUrl of FALLBACK_URLS) {
                try {
                    originalRequest._retryCount++;
                    console.log(`Trying fallback URL ${originalRequest._retryCount}: ${fallbackUrl}`);
                    
                    const response = await axios({
                        ...originalRequest,
                        baseURL: fallbackUrl,
                    });
                    
                    return response;
                } catch (fallbackError) {
                    console.warn(`Fallback ${originalRequest._retryCount} failed:`, fallbackError.message);
                    continue;
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;
