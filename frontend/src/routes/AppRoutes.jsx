import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import LandingPage from "../pages/LandingPage";

import Profile from "../pages/common/Profile";
import Settings from "../pages/common/Settings";

// admin pages
import AdminLayout from "../layouts/AdminLayout";
import AdminHome from "../pages/admin/AdminHome";
import AdminCalendar from "../pages/admin/AdminCalendar";
import UserManagement from "../pages/admin/UserManagement";
import Courts from "../pages/admin/Courts";
import Sports from "../pages/admin/Sports";
import ClassManagement from "../pages/admin/ClassManagement";
import Bookings from "../pages/admin/Bookings";
import Payments from "../pages/admin/Payments";
import BlockedSlots from "../pages/admin/BlockedSlots";
import Enrollments from "../pages/admin/Enrollments";
import Attendance from "../pages/admin/Attendance";
import Reports from "../pages/admin/Reports";
import BookingReportPage from "../pages/admin/reports/BookingReportPage";
import PaymentsReportPage from "../pages/admin/reports/PaymentsReportPage";
import AttendanceReportPage from "../pages/admin/reports/AttendanceReportPage";
import EnrollmentsReportPage from "../pages/admin/reports/EnrollmentsReportPage";

// staff pages
import StaffLayout from "../layouts/StaffLayout";
import StaffHome from "../pages/staff/StaffHome";

// coach pages
import CoachLayout from "../layouts/CoachLayout";
import CoachHome from "../pages/coach/CoachHome";
import MyClasses from "../pages/coach/MyClasses";
import CancelledSessions from "../pages/coach/CancelledSessions";

// player pages
import PlayerLayout from "../layouts/PlayerLayout";
import PlayerHome from "../pages/player/PlayerHome";
import PlayerMyBookings from "../pages/player/PlayerMyBookings";
import PlayerMyClasses from "../pages/player/PlayerMyClasses";
import PlayerMyPayments from "../pages/player/PlayerMyPayments";
import PlayerBookCourt from "../pages/player/PlayerBookCourt";
import PlayerAvailableClasses from "../pages/player/PlayerAvailableClasses";

// define all website routes and who can access them
export default function AppRoutes() {
  return (
    <Routes>
      {/* public pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* admin only area */}
      <Route element={<ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminHome />} />
          <Route path="calendar" element={<AdminCalendar />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="courts" element={<Courts />} />
          <Route path="sports" element={<Sports />} />
          <Route path="classes" element={<ClassManagement />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="payments" element={<Payments />} />
          <Route path="blocked-slots" element={<BlockedSlots />} />
          <Route path="enrollments" element={<Enrollments />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/bookings" element={<BookingReportPage />} />
          <Route path="reports/payments" element={<PaymentsReportPage />} />
          <Route path="reports/attendance" element={<AttendanceReportPage />} />
          <Route path="reports/enrollments" element={<EnrollmentsReportPage />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      {/* staff area */}
      <Route element={<ProtectedRoute allowedRoles={["STAFF"]} />}>
        <Route path="/staff" element={<StaffLayout />}>
          <Route index element={<StaffHome />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="payments" element={<Payments />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="classes" element={<ClassManagement />} />
          <Route path="enrollments" element={<Enrollments />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      {/* coach area */}
      <Route element={<ProtectedRoute allowedRoles={["COACH"]} />}>
        <Route path="/coach" element={<CoachLayout />}>
          <Route index element={<CoachHome />} />
          <Route path="my-classes" element={<MyClasses />} />
          <Route path="cancelled-sessions" element={<CancelledSessions />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      {/* player area */}
      <Route element={<ProtectedRoute allowedRoles={["PLAYER"]} />}>
        <Route path="/player" element={<PlayerLayout />}>
          <Route index element={<PlayerHome />} />
          <Route path="book-court" element={<PlayerBookCourt />} />
          <Route path="available-classes" element={<PlayerAvailableClasses />} />
          <Route path="my-bookings" element={<PlayerMyBookings />} />
          <Route path="my-classes" element={<PlayerMyClasses />} />
          <Route path="my-payments" element={<PlayerMyPayments />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  );
}
