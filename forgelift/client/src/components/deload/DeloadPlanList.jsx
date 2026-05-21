const DeloadPlanList = ({ plan }) => {
  if (!plan) return null;

  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-4">
      <p className="font-bold text-white">Deload plan</p>
      {plan.instructions?.length ? (
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {plan.instructions.map((instruction) => (
            <li key={instruction}>{instruction}</li>
          ))}
        </ul>
      ) : null}
      {plan.nextSessionTarget ? (
        <p className="mt-3 text-sm text-forge-copper">Next target: {plan.nextSessionTarget}</p>
      ) : null}
      {plan.rebuildStrategy ? (
        <p className="mt-2 text-sm text-slate-400">{plan.rebuildStrategy}</p>
      ) : null}
    </div>
  );
};

export default DeloadPlanList;
