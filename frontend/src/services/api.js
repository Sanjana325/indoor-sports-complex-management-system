import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding session token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardize error handling here if needed
    // e.g., redirect to login on 401
    if (error.response?.status === 401) {
      console.warn("Unauthorized! Redirecting to login...");
      // localStorage.clear();
      // window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;
