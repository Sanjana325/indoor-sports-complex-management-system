import api from "./api";

const authService = {
  login: async (email, password) => {
    const response = await api.post("/api/auth/login", { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post("/api/auth/register", userData);
    return response.data;
  },

  logout: () => {
    localStorage.clear();
  }
};

export default authService;
