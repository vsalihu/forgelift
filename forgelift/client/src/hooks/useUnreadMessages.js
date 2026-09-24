import { useEffect, useState } from "react";
import { useAuth } from "./useAuth.js";
import { chatService } from "../services/chatService.js";

export const useUnreadMessages = () => {
  const { isAuthenticated } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setCount(0);
      return undefined;
    }

    let active = true;

    const refresh = async () => {
      try {
        const data = await chatService.getUnreadCount();
        if (active) setCount(data.count || 0);
      } catch (_err) {
        // ignore transient poll failures
      }
    };

    refresh();
    const interval = window.setInterval(refresh, 10000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [isAuthenticated]);

  return count;
};
