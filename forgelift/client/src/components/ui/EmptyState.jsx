const EmptyState = ({ title, description, action, icon: Icon }) => (
  <div className="rounded-lg border border-dashed border-white/15 bg-black/20 p-6 text-center sm:p-8">
    {Icon ? <Icon className="mx-auto mb-3 h-9 w-9 text-forge-copper" /> : null}
    <h2 className="text-lg font-bold text-white">{title}</h2>
    {description ? <p className="mt-2 text-sm text-slate-400">{description}</p> : null}
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);

export default EmptyState;
