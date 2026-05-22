import StatusGlowCard from "./StatusGlowCard.jsx";

const IconMetricCard = ({ icon: Icon, label, value, status, variant = "neutral", to, tourId }) => {
  const content = (
    <StatusGlowCard data-tour-id={tourId} className="h-full transition hover:border-forge-copper/60" variant={variant}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black text-white">{value}</p>
          {status ? <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-300">{status}</p> : null}
        </div>
        {Icon ? (
          <span className="rounded-lg bg-white/10 p-2 text-forge-ember">
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
    </StatusGlowCard>
  );

  if (!to) return content;
  return <a href={to}>{content}</a>;
};

export default IconMetricCard;
