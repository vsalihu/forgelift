import { motion } from "framer-motion";

const TutorialOverlay = () => (
  <motion.div
    animate={{ opacity: 1 }}
    className="fixed inset-0 z-[60] bg-black/70"
    initial={{ opacity: 0 }}
    transition={{ duration: 0.18 }}
  />
);

export default TutorialOverlay;
