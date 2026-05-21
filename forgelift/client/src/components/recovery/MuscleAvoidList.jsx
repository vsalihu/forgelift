const MuscleAvoidList = ({ title, muscles = [], tone = "avoid" }) => {
  const classes =
    tone === "ready"
      ? "border-green-400/30 bg-green-950/20 text-green-200"
      : "border-red-400/30 bg-red-950/20 text-red-200";

  return (
    <section className="metal-panel rounded-lg p-5">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {muscles.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {muscles.map((muscle) => (
            <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${classes}`} key={muscle}>
              {muscle}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-400">No muscles in this group right now.</p>
      )}
    </section>
  );
};

export default MuscleAvoidList;
