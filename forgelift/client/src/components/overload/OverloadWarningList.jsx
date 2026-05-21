import { AlertTriangle } from "lucide-react";

const OverloadWarningList = ({ warnings = [] }) => {
  if (!warnings.length) return null;

  return (
    <div className="rounded-md border border-orange-400/20 bg-orange-500/10 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-orange-200">
        <AlertTriangle className="h-4 w-4" />
        Warnings
      </div>
      <ul className="space-y-1 text-sm text-orange-100/90">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </div>
  );
};

export default OverloadWarningList;
