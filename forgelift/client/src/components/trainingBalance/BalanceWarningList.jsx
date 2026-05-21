const BalanceWarningList = ({ title, items = [], tone = "warning" }) => {
  const textClass = tone === "recommendation" ? "text-green-200" : "text-orange-200";

  return (
    <section className="metal-panel rounded-lg p-5">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {items.length ? (
        <ul className="mt-4 space-y-3 text-sm leading-6">
          {items.map((item) => (
            <li className={textClass} key={item}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-400">No items to show.</p>
      )}
    </section>
  );
};

export default BalanceWarningList;
