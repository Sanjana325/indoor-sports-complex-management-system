import api from "./api";

const coachService = {
  getMyClasses: async () => {
    const response = await api.get("/api/coach/my-classes");
    return response.data;
  },

  getCancelledSessions: async () => {
    const response = await api.get("/api/coach/cancelled-sessions");
    return response.data;
  },

  cancelSession: async (classId, sessionDate) => {
    const response = await api.post(`/api/coach/classes/${classId}/cancel`, { date: sessionDate });
    return response.data;
  }
};

export default coachService;
