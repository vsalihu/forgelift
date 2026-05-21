import { createContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("ironrankToken"));
  const [loading, setLoading] = useState(true);

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
        localStorage.removeItem("ironrankToken");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const applyAuthResponse = (data) => {
    localStorage.setItem("ironrankToken", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => applyAuthResponse(await api.register(payload));
  const login = async (payload) => applyAuthResponse(await api.login(payload));

  const logout = () => {
    localStorage.removeItem("ironrankToken");
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
