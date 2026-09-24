import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import BrandSignature from "../brand/BrandSignature.jsx";

const LoadingOverlay = ({ open, text = "Logging in...", slowText = "Still working. The server is waking up, this can take up to a minute." }) => {
  const [showSlowText, setShowSlowText] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowSlowText(false);
      return undefined;
    }

    const timeout = window.setTimeout(() => setShowSlowText(true), 4000);
    return () => window.clearTimeout(timeout);
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-forge-black/90 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <img alt="ForgeLift" className="mx-auto h-12 w-auto" src="/logo-full.png" />
            <p className="mt-3 text-sm text-forge-steel">{showSlowText ? slowText : text}</p>
            <BrandSignature variant="loader" />
            <div className="mx-auto mt-5 h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full w-1/2 rounded-full bg-forge-ember"
                animate={{ x: ["-100%", "220%"] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default LoadingOverlay;
