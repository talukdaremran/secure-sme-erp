import { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../api/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadCurrentUser() {
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get("/auth/me");
      setUser(response.data.data.user);
    } catch (error) {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const response = await apiClient.post("/auth/login", {
      email,
      password,
    });

    const { token, user } = response.data.data;

    localStorage.setItem("token", token);
    setUser(user);

    return user;
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  useEffect(() => {
    loadCurrentUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}