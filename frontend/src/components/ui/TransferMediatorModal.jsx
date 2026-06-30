import { useState } from 'react';

export default function TransferMediatorModal({ participants, mediatorId, onTransfer, onClose }) {
  const entries = Object.values(participants).filter(
    (p) => p.user_name && p.user_id !== mediatorId,
  );
  const [target, setTarget] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const handleSelect = (p) => {
    setTarget(p);
    setConfirming(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="glass-panel p-6 w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Transfer Mediator</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {!confirming && (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {entries.map((p) => (
              <button
                key={p.user_id}
                onClick={() => handleSelect(p)}
                className="w-full text-sm text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                {p.user_name}
              </button>
            ))}
            {entries.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">
                No other participants available.
              </p>
            )}
          </div>
        )}

        {confirming && target && (
          <div className="space-y-3">
            <p className="text-sm text-slate-300">
              Transfer mediator to{' '}
              <span className="text-poker-400 font-semibold">{target.user_name}</span>?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onTransfer(target.user_id);
                  onClose();
                }}
                className="flex-1 text-sm px-4 py-2 rounded-lg bg-poker-500/20 hover:bg-poker-500/30 text-poker-300 border border-poker-500/30 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setTarget(null);
                  setConfirming(false);
                }}
                className="flex-1 text-sm px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
