import { motion } from "framer-motion";

const TutorialHighlight = ({ rect }) => {
  if (!rect) return null;

  return (
    <motion.div
      animate={{
        left: rect.left - 8,
        top: rect.top - 8,
        width: rect.width + 16,
        height: rect.height + 16
      }}
      className="pointer-events-none fixed z-[70] rounded-2xl border-2 border-forge-copper/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.70),0_0_34px_rgba(251,146,60,0.5)]"
      initial={false}
      transition={{ duration: 0.2, ease: "easeOut" }}
    />
  );
};

export default TutorialHighlight;
