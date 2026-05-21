import { motion } from "framer-motion";

const StatCard = ({ title, value, icon: Icon, note }) => {
  return (
    <motion.div
      className="metal-panel rounded-lg p-5 shadow-metal"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-forge-steel">{title}</p>
        {Icon ? <Icon className="h-5 w-5 text-forge-ember" /> : null}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {note ? <p className="mt-2 text-sm text-slate-400">{note}</p> : null}
    </motion.div>
  );
};

export default StatCard;
