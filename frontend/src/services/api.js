import axios from "axios";

// backend server address
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// create axios instance with base settings
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// add the auth token to every request if it exists
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

// handle global response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // check if user is unauthorized
    if (error.response?.status === 401) {
      console.warn("Unauthorized! Redirecting to login...");
    }
    return Promise.reject(error);
  }
);

export default api;
