import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";

import Profile from "../pages/common/Profile";
import Settings from "../pages/common/Settings";

// Admin
import AdminLayout from "../layouts/AdminLayout";
import AdminHome from "../pages/admin/AdminHome";
import UserManagement from "../pages/admin/UserManagement";
import Courts from "../pages/admin/Courts";
import ClassManagement from "../pages/admin/ClassManagement";
import Bookings from "../pages/admin/Bookings";
import Payments from "../pages/admin/Payments";
import BlockedSlots from "../pages/admin/BlockedSlots";
import Enrollments from "../pages/admin/Enrollments";
import Attendance from "../pages/admin/Attendance";
import Reports from "../pages/admin/Reports";

// Staff
import StaffLayout from "../layouts/StaffLayout";
import StaffHome from "../pages/staff/StaffHome";

// Coach
import CoachLayout from "../layouts/CoachLayout";
import CoachHome from "../pages/coach/CoachHome";
import MyClasses from "../pages/coach/MyClasses";

// Player
import PlayerLayout from "../layouts/PlayerLayout";
import PlayerHome from "../pages/player/PlayerHome";
import PlayerMyBookings from "../pages/player/PlayerMyBookings";
import PlayerMyClasses from "../pages/player/PlayerMyClasses";
import PlayerMyPayments from "../pages/player/PlayerMyPayments";
import PlayerBookCourt from "../pages/player/PlayerBookCourt";
import PlayerAvailableClasses from "../pages/player/PlayerAvailableClasses";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminHome />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="courts" element={<Courts />} />
        <Route path="classes" element={<ClassManagement />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="payments" element={<Payments />} />
        <Route path="blocked-slots" element={<BlockedSlots />} />
        <Route path="enrollments" element={<Enrollments />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="reports" element={<Reports />} />

        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Staff */}
      <Route path="/staff" element={<StaffLayout />}>
        <Route index element={<StaffHome />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="payments" element={<Payments />} />

        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Coach */}
      <Route path="/coach" element={<CoachLayout />}>
        <Route index element={<CoachHome />} />
        <Route path="my-classes" element={<MyClasses />} />

        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Player */}
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
    </Routes>
  );
}
