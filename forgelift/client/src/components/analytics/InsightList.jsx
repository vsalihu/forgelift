const InsightList = ({ title = "Insights", items = [] }) => (
  <section className="metal-panel rounded-lg p-5">
    <h2 className="text-xl font-bold text-white">{title}</h2>
    {items.length ? (
      <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
        {items.map((item) => (
          <li className="rounded-md bg-black/20 p-3" key={item}>
            {item}
          </li>
        ))}
      </ul>
    ) : (
      <p className="mt-4 text-sm text-slate-400">No insights yet. Log more workouts to build a stronger signal.</p>
    )}
  </section>
);

export default InsightList;
