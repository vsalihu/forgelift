const MetricCard = ({ label, value, note }) => (
  <div className="rounded-lg border border-white/10 bg-black/20 p-4">
    <p className="text-sm text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-black text-white">{value}</p>
    {note ? <p className="mt-1 text-sm text-slate-500">{note}</p> : null}
  </div>
);

export default MetricCard;
