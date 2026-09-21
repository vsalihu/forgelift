import { useEffect } from "react";

export const useBodyScrollLock = (locked) => {
  useEffect(() => {
    if (!locked) return undefined;

    const { overflow, touchAction } = document.body.style;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = overflow;
      document.body.style.touchAction = touchAction;
    };
  }, [locked]);
};
