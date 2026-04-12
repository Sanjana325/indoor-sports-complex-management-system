import api from "./api";

const playerService = {
  getMyClasses: async () => {
    const response = await api.get("/api/player/my-classes");
    return response.data;
  },

  leaveClass: async (enrollmentId) => {
    const response = await api.patch(`/api/player/my-classes/${enrollmentId}/leave`);
    return response.data;
  },

  getAvailableClasses: async () => {
    const response = await api.get("/api/player/classes/available");
    return response.data;
  },

  enrollInClass: async (classId) => {
    const response = await api.post(`/api/player/classes/${classId}/enroll`);
    return response.data;
  },

  getMyBookings: async () => {
    const response = await api.get("/api/player/my-bookings");
    return response.data;
  },

  getMyPayments: async () => {
    const response = await api.get("/api/player/payments");
    return response.data;
  }
};

export default playerService;
