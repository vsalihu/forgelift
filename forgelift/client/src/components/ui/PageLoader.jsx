import { motion } from "framer-motion";
import BrandSignature from "../brand/BrandSignature.jsx";

const PageLoader = ({ text = "Forging your progress..." }) => (
  <div className="flex min-h-screen items-center justify-center bg-forge-black px-4">
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <img alt="ForgeLift" className="mx-auto h-12 w-auto" src="/logo-full.png" />
      <p className="mt-3 text-sm text-forge-steel">{text}</p>
      <BrandSignature variant="loader" />
      <div className="mx-auto mt-5 h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full w-1/2 rounded-full bg-forge-ember"
          animate={{ x: ["-100%", "220%"] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  </div>
);

export default PageLoader;
