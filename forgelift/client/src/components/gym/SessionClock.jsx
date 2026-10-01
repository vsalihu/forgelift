import { useEffect, useState } from "react";
import { formatClock } from "./gymUtils.js";

// Ticks on its own so the rest of Gym Mode does not re-render every second.
const SessionClock = ({ startedAt, className = "" }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const elapsed = (now - new Date(startedAt || now).getTime()) / 1000;

  return (
    <span className={`tabular-nums ${className}`}>
      <span className="sr-only">Session time </span>
      {formatClock(elapsed)}
    </span>
  );
};

export default SessionClock;
