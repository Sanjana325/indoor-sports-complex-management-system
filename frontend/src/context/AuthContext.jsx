import { createContext, useState, useEffect } from "react";
import authService from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load from localStorage
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    
    if (storedToken && storedRole) {
      setUser({
        token: storedToken,
        role: storedRole,
        firstName: localStorage.getItem("firstName"),
        lastName: localStorage.getItem("lastName"),
        email: localStorage.getItem("email"),
        userId: localStorage.getItem("userId"),
        mustChangePassword: localStorage.getItem("mustChangePassword") === "true"
      });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    
    // Safety check as per current Login.jsx logic
    if (!data.token || !data.user || !data.user.role) {
      throw new Error("Invalid response from server");
    }

    const userData = {
      token: data.token,
      role: data.user.role,
      firstName: data.user.firstName,
      lastName: data.user.lastName,
      email: data.user.email || email,
      userId: String(data.user.userId || ""),
      mustChangePassword: Boolean(data.mustChangePassword)
    };

    // Save to localStorage (Preserve exact format as requested)
    localStorage.setItem("token", userData.token);
    localStorage.setItem("userId", userData.userId);
    localStorage.setItem("firstName", userData.firstName || "");
    localStorage.setItem("lastName", userData.lastName || "");
    localStorage.setItem("email", userData.email);
    localStorage.setItem("role", userData.role);
    localStorage.setItem("mustChangePassword", userData.mustChangePassword ? "true" : "false");

    setUser(userData);
    return userData;
  };

  /**
   * Dynamically updates user state and localStorage.
   * Useful for syncing changes like 'mustChangePassword' after a password update.
   */
  const updateUser = (updates) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      
      // Sync to localStorage
      if (updates.firstName !== undefined) localStorage.setItem("firstName", updates.firstName || "");
      if (updates.lastName !== undefined) localStorage.setItem("lastName", updates.lastName || "");
      if (updates.email !== undefined) localStorage.setItem("email", updates.email || "");
      if (updates.role !== undefined) localStorage.setItem("role", updates.role || "");
      if (updates.mustChangePassword !== undefined) {
        localStorage.setItem("mustChangePassword", updates.mustChangePassword ? "true" : "false");
      }
      
      return updated;
    });
  };

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
