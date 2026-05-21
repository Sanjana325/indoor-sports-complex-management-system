import { createContext, useState, useEffect } from "react";
import authService from "../services/authService";

export const AuthContext = createContext();

// manages user login state and session for the whole app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // load saved user data from storage on startup
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    
    if (storedToken && storedRole) {
      setUser({
        token: storedToken,
        role: storedRole,
        firstName: localStorage.getItem("firstName"),
        lastName: localStorage.getItem("lastName"),
        email: localStorage.getItem("email"),
        phone: localStorage.getItem("phone"),
        userId: localStorage.getItem("userId"),
        specialization: localStorage.getItem("specialization") || "",
        qualifications: localStorage.getItem("qualifications") || "",
        mustChangePassword: localStorage.getItem("mustChangePassword") === "true"
      });
    }
    setLoading(false);
  }, []);

  // handle user login
  const login = async (email, password) => {
    const data = await authService.login(email, password);
    
    if (!data.token || !data.user || !data.user.role) {
      throw new Error("Invalid response from server");
    }

    const userData = {
      token: data.token,
      role: data.user.role,
      firstName: data.user.firstName,
      lastName: data.user.lastName,
      email: data.user.email || email,
      phone: data.user.phoneNumber || "",
      userId: String(data.user.userId || ""),
      specialization: data.user.specialization || "",
      qualifications: data.user.qualifications || "",
      mustChangePassword: Boolean(data.mustChangePassword)
    };

    // save session data to browser storage
    localStorage.setItem("token", userData.token);
    localStorage.setItem("userId", userData.userId);
    localStorage.setItem("firstName", userData.firstName || "");
    localStorage.setItem("lastName", userData.lastName || "");
    localStorage.setItem("email", userData.email);
    localStorage.setItem("phone", userData.phone || "");
    localStorage.setItem("role", userData.role);
    localStorage.setItem("specialization", userData.specialization || "");
    localStorage.setItem("qualifications", userData.qualifications || "");
    localStorage.setItem("mustChangePassword", userData.mustChangePassword ? "true" : "false");

    setUser(userData);
    return userData;
  };

  // update cached user data
  const updateUser = (updates) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      
      // sync updates to storage
      if (updates.firstName !== undefined) localStorage.setItem("firstName", updates.firstName || "");
      if (updates.lastName !== undefined) localStorage.setItem("lastName", updates.lastName || "");
      if (updates.email !== undefined) localStorage.setItem("email", updates.email || "");
      if (updates.phone !== undefined) localStorage.setItem("phone", updates.phone || "");
      if (updates.role !== undefined) localStorage.setItem("role", updates.role || "");
      if (updates.mustChangePassword !== undefined) {
        localStorage.setItem("mustChangePassword", updates.mustChangePassword ? "true" : "false");
      }
      
      return updated;
    });
  };

  // clear user session
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
