const statusStyles = {
  "Fully Recovered": "border-green-400/50 bg-green-950/30 text-green-200",
  "Mostly Ready": "border-yellow-400/50 bg-yellow-950/30 text-yellow-200",
  "Not Fully Recovered": "border-orange-400/50 bg-orange-950/30 text-orange-200",
  "Poor Recovery": "border-red-400/50 bg-red-950/30 text-red-200"
};

const RecoveryStatusBadge = ({ status }) => {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[status] || statusStyles["Fully Recovered"]}`}>
      {status}
    </span>
  );
};

export default RecoveryStatusBadge;
