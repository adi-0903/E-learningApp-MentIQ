import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1/';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach the API auth token automatically to all outgoing requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`; // Connect login credentials/auth key
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Optional: refresh expired tokens seamlessly
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const res = await axios.post(`${API_URL}auth/token/refresh/`, { refresh: refreshToken });
                    if (res.data && res.data.access) {
                        localStorage.setItem('accessToken', res.data.access);
                        originalRequest.headers['Authorization'] = `Bearer ${res.data.access}`;
                        return api(originalRequest);
                    }
                }
            } catch (err) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                // You could trigger a custom event here to log user out visually
            }
        }
        return Promise.reject(error);
    }
);

export default api;
