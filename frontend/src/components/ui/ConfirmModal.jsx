export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
  danger,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="glass-panel p-5 w-full max-w-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <p className="text-sm text-slate-300">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className={`flex-1 text-sm px-4 py-2 rounded-lg border transition-colors ${
              danger
                ? "bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30"
                : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30"
            }`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 text-sm px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
