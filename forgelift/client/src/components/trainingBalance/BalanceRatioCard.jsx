const BalanceRatioCard = ({ title, value, description }) => {
  return (
    <div className="metal-panel rounded-lg p-5">
      <p className="text-sm text-forge-steel">{title}</p>
      <p className="mt-2 text-3xl font-black text-white">{value || 0}x</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
};

export default BalanceRatioCard;
