const BodyweightHistoryChart = ({ entries = [] }) => {
  const ordered = [...entries].reverse().slice(-12);
  const weights = ordered.map((entry) => Number(entry.weight) || 0);
  const min = Math.min(...weights, 0);
  const max = Math.max(...weights, 1);

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <p className="mb-3 font-bold text-white">Bodyweight history</p>
      {ordered.length ? (
        <div className="flex h-28 items-end gap-2">
          {ordered.map((entry) => {
            const height = max === min ? 50 : ((entry.weight - min) / (max - min)) * 70 + 20;
            return (
              <div className="flex flex-1 flex-col items-center gap-2" key={entry._id}>
                <div className="w-full rounded-t bg-forge-ember/80" style={{ height: `${height}%` }} />
                <span className="text-[10px] text-slate-500">{Math.round(entry.weight)}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-400">No bodyweight entries yet.</p>
      )}
    </div>
  );
};

export default BodyweightHistoryChart;
