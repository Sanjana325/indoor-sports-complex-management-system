import api from "./api";

const adminService = {
  getPendingPaymentsCount: async () => {
    const response = await api.get("/api/admin/payments/pending-count");
    return response.data;
  },

  getRecentCancellations: async () => {
    const response = await api.get("/api/admin/classes/recent-cancellations");
    return response.data;
  },

  acknowledgeCancellation: async (sessionId) => {
    const response = await api.patch(`/api/admin/classes/cancel-alert/${sessionId}/acknowledge`);
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get("/api/admin/users");
    return response.data;
  },

  getCourts: async () => {
    const response = await api.get("/api/admin/courts");
    return response.data;
  },

  getSports: async () => {
    const response = await api.get("/api/admin/sports");
    return response.data;
  },

  getQualifications: async () => {
    const response = await api.get("/api/admin/qualifications");
    return response.data;
  },

  getPayments: async () => {
    const role = localStorage.getItem("role");
    const prefix = role === "STAFF" ? "/api/staff" : "/api/admin";
    const response = await api.get(`${prefix}/payments`);
    return response.data;
  },

  verifyPayment: async (paymentId) => {
    const role = localStorage.getItem("role");
    const prefix = role === "STAFF" ? "/api/staff" : "/api/admin";
    const response = await api.patch(`${prefix}/payments/${paymentId}/verify`);
    return response.data;
  },

  rejectPayment: async (paymentId) => {
    const role = localStorage.getItem("role");
    const prefix = role === "STAFF" ? "/api/staff" : "/api/admin";
    const response = await api.patch(`${prefix}/payments/${paymentId}/reject`);
    return response.data;
  }
};

export default adminService;
