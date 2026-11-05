import { useEffect, useState } from "react";

// One "after login" popup at a time (What's new, the daily check-in). A popup claims the slot
// before opening and releases it when closed; others wait their turn.
let holder = null;
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener(holder));

export const claimModal = (id) => {
  if (holder && holder !== id) return false;
  holder = id;
  notify();
  return true;
};

export const releaseModal = (id) => {
  if (holder !== id) return;
  holder = null;
  notify();
};

export const useModalHolder = () => {
  const [current, setCurrent] = useState(holder);
  useEffect(() => {
    listeners.add(setCurrent);
    return () => listeners.delete(setCurrent);
  }, []);
  return current;
};
