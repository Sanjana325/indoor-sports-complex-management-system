import api from "./api";

// handles auth requests to the server
const authService = {
  // send login credentials to backend
  login: async (email, password) => {
    const response = await api.post("/api/auth/login", { email, password });
    return response.data;
  },

  // register a new user
  register: async (userData) => {
    const response = await api.post("/api/auth/register", userData);
    return response.data;
  },

  // clear local session
  logout: () => {
    localStorage.clear();
  }
};

export default authService;
