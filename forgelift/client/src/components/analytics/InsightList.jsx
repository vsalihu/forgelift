const InsightList = ({ title = "Insights", items = [], icon: Icon, numbered = false }) => (
  <section className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.01] p-4 sm:p-5">
    <h3 className="font-display flex items-center gap-2 text-lg text-white">
      {Icon ? <Icon aria-hidden="true" className="h-5 w-5 text-orange-300" /> : null}
      {title}
    </h3>
    {items.length ? (
      <ol className="mt-3 space-y-2.5 text-sm leading-6 text-zinc-300">
        {items.map((item, index) => (
          <li className="flex gap-3" key={item}>
            {numbered ? (
              <span className="font-display mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forge-ember/15 text-xs text-orange-300">{index + 1}</span>
            ) : (
              <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-300/70" />
            )}
            <span>{item}</span>
          </li>
        ))}
      </ol>
    ) : (
      <p className="mt-3 text-sm text-zinc-400">Nothing yet. Log a few more workouts to build a signal.</p>
    )}
  </section>
);

export default InsightList;
