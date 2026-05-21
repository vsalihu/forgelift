const rpeRows = [
  ["RPE 6", "Easy, around 4 reps left"],
  ["RPE 7", "Moderate, around 3 reps left"],
  ["RPE 8", "Hard but controlled, around 2 reps left"],
  ["RPE 9", "Very hard, around 1 rep left"],
  ["RPE 10", "Maximum effort, no reps left"]
];

const RpeGuide = () => (
  <div className="rounded-lg border border-white/10 bg-black/20 p-4">
    <h3 className="text-sm font-bold text-white">Quick RPE guide</h3>
    <div className="mt-3 space-y-2">
      {rpeRows.map(([label, description]) => (
        <div className="flex gap-3 text-sm" key={label}>
          <span className="w-16 shrink-0 font-bold text-forge-copper">{label}</span>
          <span className="text-slate-300">{description}</span>
        </div>
      ))}
    </div>
  </div>
);

export default RpeGuide;
