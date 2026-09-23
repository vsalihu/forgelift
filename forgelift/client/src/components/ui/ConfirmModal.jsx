import Button from "../Button.jsx";

const ConfirmModal = ({ title, description, confirmLabel = "Confirm", cancelLabel = "Go Back", loading = false, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
    <div className="w-full max-w-md rounded-xl border border-red-400/30 bg-forge-panel p-5 shadow-2xl">
      <h2 className="text-2xl font-black text-white">{title}</h2>
      {description ? <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p> : null}
      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button loading={loading} type="button" variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  </div>
);

export default ConfirmModal;
