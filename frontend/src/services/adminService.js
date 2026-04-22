import api from "./api";

// handles interactions for the admin dashboard and management functions
const adminService = {
  // get total number of payments that need management review
  getPendingPaymentsCount: async () => {
    const response = await api.get("/api/admin/payments/pending-count");
    return response.data;
  },

  // list class sessions that were recently called off
  getRecentCancellations: async () => {
    const response = await api.get("/api/admin/classes/recent-cancellations");
    return response.data;
  },

  // mark a cancellation alert as seen by the admin
  acknowledgeCancellation: async (sessionId) => {
    const response = await api.patch(`/api/admin/classes/cancel-alert/${sessionId}/acknowledge`);
    return response.data;
  },

  // get a list of all registered users in the system
  getUsers: async () => {
    const response = await api.get("/api/admin/users");
    return response.data;
  },

  // fetch data about all physical courts/arenas
  getCourts: async () => {
    const response = await api.get("/api/admin/courts");
    return response.data;
  },

  // get all sports categories available
  getSports: async () => {
    const response = await api.get("/api/admin/sports");
    return response.data;
  },

  // fetch coach specializations and qualifications
  getQualifications: async () => {
    const response = await api.get("/api/admin/qualifications");
    return response.data;
  },

  // get payment records (works for both staff and super-admins)
  getPayments: async () => {
    const role = localStorage.getItem("role");
    const prefix = role === "STAFF" ? "/api/staff" : "/api/admin";
    const response = await api.get(`${prefix}/payments`);
    return response.data;
  },

  // approve a bank deposit payment after checking the slip
  verifyPayment: async (paymentId) => {
    const role = localStorage.getItem("role");
    const prefix = role === "STAFF" ? "/api/staff" : "/api/admin";
    const response = await api.patch(`${prefix}/payments/${paymentId}/verify`);
    return response.data;
  },

  // reject a payment if the slip is invalid or incorrect
  rejectPayment: async (paymentId) => {
    const role = localStorage.getItem("role");
    const prefix = role === "STAFF" ? "/api/staff" : "/api/admin";
    const response = await api.patch(`${prefix}/payments/${paymentId}/reject`);
    return response.data;
  }
};

export default adminService;
