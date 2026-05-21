import { motion } from "framer-motion";
import { Dumbbell } from "lucide-react";
import BrandSignature from "../brand/BrandSignature.jsx";

const PageLoader = ({ text = "Forging your progress..." }) => (
  <div className="flex min-h-screen items-center justify-center bg-forge-black px-4">
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-forge-ember text-white shadow-metal">
        <Dumbbell className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-2xl font-black text-white">ForgeLift</h1>
      <p className="mt-2 text-sm text-forge-steel">{text}</p>
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
