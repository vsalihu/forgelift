import { useEffect, useState } from "react";
import { competitionService } from "../services/competitionService.js";
import { useAuth } from "./useAuth.js";

// Shared across pages: every page mounts its own Layout, so the standing lives in
// one module-level store instead of being refetched on each navigation.
const STALE_MS = 60 * 1000;
const store = { standing: null, fetchedAt: 0, request: null };
const listeners = new Set();

const publish = () => listeners.forEach((listener) => listener(store.standing));

export const refreshStanding = async ({ force = false } = {}) => {
  if (!force && store.request) return store.request;
  if (!force && store.standing && Date.now() - store.fetchedAt < STALE_MS) return store.standing;

  store.request = competitionService
    .getStanding()
    .then((data) => {
      store.standing = data.standing;
      store.fetchedAt = Date.now();
      publish();
      return store.standing;
    })
    .catch(() => store.standing)
    .finally(() => {
      store.request = null;
    });
  return store.request;
};

// After the user has seen a place change, remember it so the popup shows once.
export const acknowledgeStanding = async () => {
  const standing = store.standing;
  if (!standing?.enabled || !standing.board?.key) return;
  store.standing = { ...standing, previousPlace: standing.place };
  publish();
  try {
    await competitionService.markStandingSeen(standing.board.key, standing.place);
  } catch (_error) {
    // Worst case the popup shows again next visit.
  }
};

export const clearStanding = () => {
  store.standing = null;
  store.fetchedAt = 0;
  publish();
};

export const useCompetitionStanding = () => {
  const { isAuthenticated } = useAuth();
  const [standing, setStanding] = useState(store.standing);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    listeners.add(setStanding);
    refreshStanding();
    return () => listeners.delete(setStanding);
  }, [isAuthenticated]);

  return isAuthenticated ? standing : null;
};
