import api from "./api";

// api interactions for the player dashboard and features
const playerService = {
  // get classes the current player is enrolled in
  getMyClasses: async () => {
    const response = await api.get("/api/player/my-classes");
    return response.data;
  },

  // allow player to leave/unenroll from a class
  leaveClass: async (enrollmentId) => {
    const response = await api.patch(`/api/player/my-classes/${enrollmentId}/leave`);
    return response.data;
  },

  // get a list of classes that are open for enrollment
  getAvailableClasses: async () => {
    const response = await api.get("/api/player/classes/available");
    return response.data;
  },

  // join a new coaching class
  enrollInClass: async (classId) => {
    const response = await api.post(`/api/player/classes/${classId}/enroll`);
    return response.data;
  },

  // get all court bookings made by this player
  getMyBookings: async () => {
    const response = await api.get("/api/player/bookings");
    return response.data;
  },

  // see the current player's payment history
  getMyPayments: async () => {
    const response = await api.get("/api/player/payments");
    return response.data;
  },

  // list available sports for booking
  getSports: async () => {
    const response = await api.get("/api/player/sports");
    return response.data;
  }
};

export default playerService;
