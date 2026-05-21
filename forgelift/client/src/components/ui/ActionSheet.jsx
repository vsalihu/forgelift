import BottomSheet from "./BottomSheet.jsx";

const ActionSheet = ({ open, title = "Actions", actions = [], onClose }) => (
  <BottomSheet open={open} title={title} onClose={onClose}>
    <div className="space-y-2">
      {actions.map((action) => (
        <button
          className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-4 text-left text-sm font-bold transition ${
            action.danger ? "bg-red-500/10 text-red-100 hover:bg-red-500/20" : "bg-white/10 text-white hover:bg-white/15"
          }`}
          disabled={action.disabled}
          key={action.label}
          type="button"
          onClick={() => {
            action.onClick?.();
            onClose?.();
          }}
        >
          {action.icon ? <action.icon className="h-4 w-4" /> : null}
          {action.label}
        </button>
      ))}
    </div>
  </BottomSheet>
);

export default ActionSheet;
