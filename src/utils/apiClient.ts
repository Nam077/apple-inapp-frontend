import axios from "axios";

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_SERVER,
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);