import api from "./api";

// api calls for coach specific dashboard and actions
const coachService = {
  // get a list of classes assigned to this coach
  getMyClasses: async () => {
    const response = await api.get("/api/coach/my-classes");
    return response.data;
  },

  // see any sessions that were marked as cancelled
  getCancelledSessions: async () => {
    const response = await api.get("/api/coach/cancelled-sessions");
    return response.data;
  },

  // allow coach to cancel a specific session date for their class
  cancelSession: async (classId, sessionDate) => {
    const response = await api.post(`/api/coach/classes/${classId}/cancel`, { date: sessionDate });
    return response.data;
  }
};

export default coachService;
