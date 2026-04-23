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
  },

  // get dashboard metrics and chart data
  getDashboardStats: async (start, end) => {
    const response = await api.get(`/api/admin/reports/dashboard-stats?start=${start}&end=${end}`);
    return response.data;
  },

  // create a new sport discipline
  createSport: async (data) => {
    const response = await api.post("/api/admin/sports", data);
    return response.data;
  },

  // update an existing sport configuration
  updateSport: async (id, data) => {
    const response = await api.put(`/api/admin/sports/${id}`, data);
    return response.data;
  },

  // delete a sport (guarded by database constraints)
  deleteSport: async (id) => {
    const response = await api.delete(`/api/admin/sports/${id}`);
    return response.data;
  },

  // create a new physical court/arena
  createCourt: async (data) => {
    const response = await api.post("/api/admin/courts", data);
    return response.data;
  },

  // update court settings
  updateCourt: async (id, data) => {
    const response = await api.put(`/api/admin/courts/${id}`, data);
    return response.data;
  },

  // remove a court from the system
  deleteCourt: async (id) => {
    const response = await api.delete(`/api/admin/courts/${id}`);
    return response.data;
  },

  // get all court bookings (all users)
  getBookings: async () => {
    const role = localStorage.getItem("role");
    const prefix = role === "STAFF" ? "/api/staff" : "/api/admin";
    const response = await api.get(`${prefix}/bookings`);
    return response.data;
  },

  // void a booking record
  cancelBooking: async (id) => {
    const response = await api.patch(`/api/admin/bookings/${id}/cancel`);
    return response.data;
  },

  // get all class enrollments
  getEnrollments: async () => {
    const role = localStorage.getItem("role");
    const prefix = role === "STAFF" ? "/api/staff" : "/api/admin";
    const response = await api.get(`${prefix}/enrollments`);
    return response.data;
  },

  // terminate a student enrollment
  cancelEnrollment: async (id, reason) => {
    const response = await api.patch(`/api/admin/enrollments/${id}/cancel`, { reason });
    return response.data;
  },

  // list classes available for taking attendance
  getAttendanceClasses: async () => {
    const role = localStorage.getItem("role");
    const prefix = role === "STAFF" ? "/api/staff" : "/api/admin";
    const response = await api.get(`${prefix}/attendance/classes`);
    return response.data;
  },

  // fetch students and session info for attendance tracking
  getAttendance: async (classId, sessionDate) => {
    const role = localStorage.getItem("role");
    const prefix = role === "STAFF" ? "/api/staff" : "/api/admin";
    const response = await api.get(`${prefix}/attendance`, { params: { classId, sessionDate } });
    return response.data;
  },

  // save attendance marks for a class session
  saveAttendance: async (sessionId, attendanceMarks) => {
    const role = localStorage.getItem("role");
    const prefix = role === "STAFF" ? "/api/staff" : "/api/admin";
    const response = await api.post(`${prefix}/attendance`, { sessionId, attendanceMarks });
    return response.data;
  },

  // list all blocked time slots
  getBlockedSlots: async () => {
    const response = await api.get("/api/admin/blocked-slots");
    return response.data;
  },

  // block a new time slot
  createBlockedSlot: async (data) => {
    const response = await api.post("/api/admin/blocked-slots", data);
    return response.data;
  },

  // update an existing block rule
  updateBlockedSlot: async (id, data) => {
    const response = await api.put(`/api/admin/blocked-slots/${id}`, data);
    return response.data;
  },

  // remove a block and make the slot bookable again
  deleteBlockedSlot: async (id) => {
    const response = await api.delete(`/api/admin/blocked-slots/${id}`);
    return response.data;
  },

  // list all coaches and their specialties
  getCoaches: async () => {
    const response = await api.get("/api/admin/coaches");
    return response.data;
  },

  // list specific coaching sessions (for calendar)
  getClassSessions: async () => {
    const response = await api.get("/api/admin/classes/sessions");
    return response.data;
  },

  // list all coaching classes
  getClasses: async () => {
    const role = localStorage.getItem("role");
    const prefix = role === "STAFF" ? "/api/staff" : "/api/admin";
    const response = await api.get(`${prefix}/classes`);
    return response.data;
  },

  // list the history of session cancellations
  getClassCancellationsHistory: async () => {
    const response = await api.get("/api/admin/classes/cancellations/history");
    return response.data;
  },

  // check which courts are free for a specific class schedule
  checkCourtAvailability: async (payload) => {
    const response = await api.post("/api/admin/classes/check-courts", payload);
    return response.data;
  },

  // create a new coaching class series
  createClass: async (data) => {
    const response = await api.post("/api/admin/classes", data);
    return response.data;
  },

  // update class details or schedule
  updateClass: async (id, data) => {
    const response = await api.put(`/api/admin/classes/${id}`, data);
    return response.data;
  },

  // remove a class series from the system
  deleteClass: async (id) => {
    const response = await api.delete(`/api/admin/classes/${id}`);
    return response.data;
  },

  // activate a class schedule
  activateClass: async (id) => {
    const response = await api.patch(`/api/admin/classes/${id}/activate`);
    return response.data;
  },

  // deactivate a class schedule (no new enrollments)
  deactivateClass: async (id) => {
    const response = await api.patch(`/api/admin/classes/${id}/deactivate`);
    return response.data;
  },

  // list available courts for a specific time and schedule
  getAvailableCourts: async (params) => {
    const response = await api.get("/api/admin/classes/available-courts", { params });
    return response.data;
  },

  // disable a user's login access
  disableUser: async (id) => {
    const response = await api.patch(`/api/admin/users/${id}/disable`);
    return response.data;
  },

  // restore a user's login access
  enableUser: async (id) => {
    const response = await api.patch(`/api/admin/users/${id}/enable`);
    return response.data;
  },

  // create a new system user
  createUser: async (data) => {
    const response = await api.post("/api/admin/users", data);
    return response.data;
  },

  // update a user's profile information
  updateUser: async (id, data) => {
    const response = await api.put(`/api/admin/users/${id}`, data);
    return response.data;
  },

  // permanently delete a user record
  deleteUser: async (id) => {
    const response = await api.delete(`/api/admin/users/${id}`);
    return response.data;
  }
};

export default adminService;
