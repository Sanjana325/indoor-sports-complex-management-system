import api from "./api";

const staffService = {
  getRecentCancellations: async () => {
    const response = await api.get("/api/staff/classes/recent-cancellations");
    return response.data;
  },

  acknowledgeCancellation: async (sessionId) => {
    const response = await api.patch(`/api/staff/classes/cancel-alert/${sessionId}/acknowledge`);
    return response.data;
  }
};

export default staffService;
