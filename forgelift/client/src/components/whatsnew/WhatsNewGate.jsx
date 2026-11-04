import { AnimatePresence } from "framer-motion";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LATEST_RELEASE } from "../../content/releases.js";
import { useAuth } from "../../hooks/useAuth.js";

const WhatsNewModal = lazy(() => import("./WhatsNewModal.jsx"));

// Never interrupt a workout in progress or the first-run flows; it waits for the next page.
const QUIET_PATHS = ["/gym-mode", "/assessment", "/onboarding"];
const SHOW_DELAY = 700;

const storageKey = (userId) => `forgeliftSeenRelease:${userId}`;
const readLocal = (userId) => {
  try {
    return localStorage.getItem(storageKey(userId));
  } catch (_error) {
    return null;
  }
};
const writeLocal = (userId, releaseId) => {
  try {
    localStorage.setItem(storageKey(userId), releaseId);
  } catch (_error) {
    // The account copy on the server is the one that matters.
  }
};

// Shows the newest "What's new" note once per account. It counts as seen as soon as it opens, on
// this device right away and on the account (so other devices skip it too).
const WhatsNewGate = () => {
  const { user, markReleaseSeen } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const settledRef = useRef(false);
  const pendingLinkRef = useRef(null);
  const release = LATEST_RELEASE;

  useEffect(() => {
    if (!user?._id || !release || settledRef.current) return undefined;

    const remember = () => {
      settledRef.current = true;
      writeLocal(user._id, release.id);
      if (user.lastSeenReleaseId !== release.id) markReleaseSeen(release.id).catch(() => {});
    };

    if (user.lastSeenReleaseId === release.id) {
      settledRef.current = true;
      return undefined;
    }
    // Seen here before, but the account never heard about it (offline at the time): catch it up.
    if (readLocal(user._id) === release.id) {
      remember();
      return undefined;
    }
    // Accounts created since this update already have everything in it.
    if (user.createdAt && new Date(user.createdAt) >= new Date(`${release.date}T00:00:00`)) {
      remember();
      return undefined;
    }
    if (QUIET_PATHS.some((path) => location.pathname.startsWith(path))) return undefined;

    const timer = window.setTimeout(() => {
      remember();
      setOpen(true);
    }, SHOW_DELAY);
    return () => window.clearTimeout(timer);
  }, [user, release, location.pathname, markReleaseSeen]);

  // A link in the note closes it first and goes to the page once it has animated out. Navigating
  // straight away can suspend the route tree mid-exit (lazy pages) and leave the note stuck on screen.
  const openLink = (to) => {
    pendingLinkRef.current = to;
    setOpen(false);
  };
  const onExitComplete = () => {
    const to = pendingLinkRef.current;
    pendingLinkRef.current = null;
    if (to) navigate(to);
  };

  return (
    <Suspense fallback={null}>
      <AnimatePresence onExitComplete={onExitComplete}>{open ? <WhatsNewModal key={release.id} release={release} onClose={() => setOpen(false)} onOpenLink={openLink} /> : null}</AnimatePresence>
    </Suspense>
  );
};

export default WhatsNewGate;
