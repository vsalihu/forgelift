const NextMonthFocusList = ({ items = [] }) => (
  <section className="metal-panel rounded-lg p-5">
    <h2 className="text-xl font-bold text-white">Next month focus</h2>
    {items.length ? (
      <ul className="mt-4 space-y-3 text-sm text-slate-300">
        {items.map((item) => (
          <li className="rounded-md bg-black/20 p-3" key={item}>
            {item}
          </li>
        ))}
      </ul>
    ) : (
      <p className="mt-4 text-sm text-slate-400">No focus items yet.</p>
    )}
  </section>
);

export default NextMonthFocusList;
