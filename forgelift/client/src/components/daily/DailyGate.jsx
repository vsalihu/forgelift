import { AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import DailyCheckInModal from "./DailyCheckInModal.jsx";
import DailySetupFlow from "./DailySetupFlow.jsx";
import { useDaily } from "../../context/DailyContext.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { claimModal, releaseModal, useModalHolder } from "../../utils/modalQueue.js";

const QUIET_PATHS = ["/gym-mode", "/assessment", "/onboarding", "/today"];
const SHOW_DELAY = 1200;
const SLOT = "daily";

const storageKey = (userId) => `forgeliftDailyPrompt:${userId}`;
const readLocal = (userId) => {
  try {
    return localStorage.getItem(storageKey(userId));
  } catch (_error) {
    return null;
  }
};
const writeLocal = (userId, day) => {
  try {
    localStorage.setItem(storageKey(userId), day);
  } catch (_error) {
    // The server also knows whether today's check-in happened.
  }
};

// After the first login of the day: the setup the first time, then a quick check-in each day.
// One prompt a day at most, never mid-workout, and it waits its turn behind "What's new".
const DailyGate = () => {
  const { user } = useAuth();
  const { data, update, saveProfile } = useDaily() || {};
  const location = useLocation();
  const holder = useModalHolder();
  const [open, setOpen] = useState(null);
  const handledDayRef = useRef(null);

  useEffect(() => {
    if (!data || !user?._id || open) return undefined;
    const day = data.day;
    if (handledDayRef.current === day || readLocal(user._id) === day) return undefined;
    const profile = data.profile || {};
    const kind = data.needsSetup ? "setup" : data.needsCheckIn && profile.checkInPrompt !== false && !profile.skippedAt ? "checkin" : null;
    if (!kind) {
      handledDayRef.current = day;
      return undefined;
    }
    if (QUIET_PATHS.some((path) => location.pathname.startsWith(path))) return undefined;
    if (holder && holder !== SLOT) return undefined;

    const timer = window.setTimeout(() => {
      if (!claimModal(SLOT)) return;
      handledDayRef.current = day;
      writeLocal(user._id, day);
      setOpen(kind);
    }, SHOW_DELAY);
    return () => window.clearTimeout(timer);
  }, [data, user?._id, open, location.pathname, holder]);

  const close = () => setOpen(null);
  const skipCheckIn = () => {
    update({ skipCheckIn: true }).catch(() => {});
    close();
  };

  return (
    <AnimatePresence onExitComplete={() => releaseModal(SLOT)}>
      {open === "setup" ? (
        <DailySetupFlow
          data={data}
          key="setup"
          user={user}
          onClose={close}
          onSaveCheckIn={update}
          onSaveProfile={saveProfile}
          onSkip={() => {
            saveProfile({ skip: true }).catch(() => {});
            close();
          }}
        />
      ) : null}
      {open === "checkin" ? (
        <DailyCheckInModal
          data={data}
          imperial={user?.preferredUnits === "imperial"}
          key="checkin"
          name={user?.name?.split(" ")[0]}
          onSave={async (body) => {
            await update(body);
            close();
          }}
          onSkip={skipCheckIn}
          onStopAsking={() => {
            saveProfile({ checkInPrompt: false }).catch(() => {});
            skipCheckIn();
          }}
        />
      ) : null}
    </AnimatePresence>
  );
};

export default DailyGate;
