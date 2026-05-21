import { useState } from "react";
import { X } from "lucide-react";
import Button from "../Button.jsx";

const ConfirmDangerModal = ({
  title,
  description,
  confirmWord,
  onConfirm,
  onCancel,
  loading = false,
  detailsList = []
}) => {
  const [typed, setTyped] = useState("");
  const canConfirm = typed === confirmWord;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-lg rounded-xl border border-red-400/30 bg-forge-panel p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-red-300">Danger zone</p>
            <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
          </div>
          <button className="rounded-md p-2 text-slate-300 hover:bg-white/10" type="button" onClick={onCancel}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-300">{description}</p>

        {detailsList.length ? (
          <ul className="mt-4 space-y-2 rounded-lg bg-black/25 p-4 text-sm text-slate-300">
            {detailsList.map((detail) => (
              <li key={detail}>- {detail}</li>
            ))}
          </ul>
        ) : null}

        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-bold text-slate-200">
            Type <span className="text-red-200">{confirmWord}</span> to confirm
          </span>
          <input
            className="min-h-11 w-full rounded-md border border-red-400/30 bg-black/30 px-3 text-white outline-none focus:border-red-300 focus:ring-2 focus:ring-red-400/20"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
          />
        </label>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={!canConfirm} loading={loading} type="button" variant="danger" onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDangerModal;
