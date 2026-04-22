import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

// convenience hook to access the global authentication state and user session data
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // ensures the hook is only used within the correct context provider to prevent null reference errors
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
