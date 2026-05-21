import { createContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("forgeliftToken"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthExpired = () => {
      localStorage.removeItem("forgeliftToken");
      setToken(null);
      setUser(null);
      setLoading(false);
    };

    window.addEventListener("forgelift:auth-expired", handleAuthExpired);

    return () => window.removeEventListener("forgelift:auth-expired", handleAuthExpired);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.getMe();
        setUser(data.user);
      } catch (_error) {
        localStorage.removeItem("forgeliftToken");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const applyAuthResponse = (data) => {
    localStorage.setItem("forgeliftToken", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => applyAuthResponse(await api.register(payload));
  const login = async (payload) => applyAuthResponse(await api.login(payload));

  const logout = () => {
    localStorage.removeItem("forgeliftToken");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const data = await api.getMe();
    setUser(data.user);
    return data.user;
  };

  const completeOnboarding = async (payload) => {
    const data = await api.completeOnboarding(payload);
    setUser(data.user);
    return data.user;
  };

  const updateProfile = async (payload) => {
    const data = await api.updateProfile(payload);
    setUser(data.user);
    return data.user;
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      register,
      login,
      logout,
      refreshUser,
      completeOnboarding,
      updateProfile
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
