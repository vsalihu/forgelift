import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth.js";
import { dailyService } from "../services/dailyService.js";
import { localDayKey, previewUpdate } from "../utils/dailyUtils.js";

const DailyContext = createContext(null);

// Today's plan, shared by the Today page, the dashboard card and the check-in, so they never
// disagree. Taps update at once and the server's answer replaces the preview when it arrives.
export const DailyProvider = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sequenceRef = useRef(0);
  const dayRef = useRef(null);
  const ready = Boolean(user?._id && user.onboardingCompleted);

  const load = useCallback(async () => {
    const day = localDayKey();
    dayRef.current = day;
    const sequence = ++sequenceRef.current;
    setLoading(true);
    try {
      const next = await dailyService.getDay(day);
      if (sequence === sequenceRef.current) {
        setData(next);
        setError("");
      }
    } catch (err) {
      if (sequence === sequenceRef.current) setError(err.message);
    } finally {
      if (sequence === sequenceRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return undefined;
    load();
    // A new day starts a new plan: refresh when the app comes back after midnight.
    const onVisible = () => {
      if (document.visibilityState === "visible" && dayRef.current !== localDayKey()) load();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [ready, user?._id, load]);

  const update = useCallback(
    async (body) => {
      const day = data?.day || localDayKey();
      const sequence = ++sequenceRef.current;
      setData((current) => (current ? previewUpdate(current, body) : current));
      try {
        const next = await dailyService.updateDay(day, body);
        // Only the newest answer wins, so fast taps never flicker back.
        if (sequence === sequenceRef.current) {
          setData(next);
          setError("");
        }
        if (body.checkIn?.morningWeight) refreshUser().catch(() => {});
        return next;
      } catch (err) {
        if (sequence === sequenceRef.current) {
          setError(err.message);
          load();
        }
        throw err;
      }
    },
    [data?.day, load, refreshUser]
  );

  // The user's own to-dos. Each call answers with the full day, which replaces what's shown.
  const todoAction = useCallback(
    async (action) => {
      const sequence = ++sequenceRef.current;
      const next = await action(data?.day || localDayKey());
      if (sequence === sequenceRef.current) setData(next);
      return next;
    },
    [data?.day]
  );
  const createTodo = useCallback((todo) => todoAction((day) => dailyService.createTodo(day, todo)), [todoAction]);
  const updateTodo = useCallback((id, todo) => todoAction((day) => dailyService.updateTodo(day, id, todo)), [todoAction]);
  const deleteTodo = useCallback((id) => todoAction((day) => dailyService.deleteTodo(day, id)), [todoAction]);

  const saveProfile = useCallback(
    async (body) => {
      const result = await dailyService.updateProfile({ ...body, today: localDayKey() });
      await Promise.all([load(), refreshUser().catch(() => {})]);
      return result;
    },
    [load, refreshUser]
  );

  const value = useMemo(
    () => ({ data, loading, error, load, update, saveProfile, createTodo, updateTodo, deleteTodo, ready }),
    [data, loading, error, load, update, saveProfile, createTodo, updateTodo, deleteTodo, ready]
  );
  return <DailyContext.Provider value={value}>{children}</DailyContext.Provider>;
};

export const useDaily = () => useContext(DailyContext);
