import api from "./api";

// service for operational staff tasks
const staffService = {
  // list class sessions that coaches have recently called off
  getRecentCancellations: async () => {
    const response = await api.get("/api/staff/classes/recent-cancellations");
    return response.data;
  },

  // staff acknowledging they've seen a cancellation alert
  acknowledgeCancellation: async (sessionId) => {
    const response = await api.patch(`/api/staff/classes/cancel-alert/${sessionId}/acknowledge`);
    return response.data;
  }
};

export default staffService;
