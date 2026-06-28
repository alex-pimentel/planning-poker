import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

export default function RoomInfo({ onLeave }) {
  const { roomInfo, isMediator } = useGameStore();
  const [copied, setCopied] = useState(false);

  const copyInviteLink = async () => {
    const link = `${window.location.origin}/?join=${roomInfo.room_code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS
      const ta = document.createElement('textarea');
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="glass-panel p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Room</h2>
            <p className="text-2xl font-bold tracking-widest text-glow">{roomInfo.room_code}</p>
          </div>
          <button
            onClick={copyInviteLink}
            className="px-2 py-1 rounded-lg text-xs transition-all
                       bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            title="Copy invite link"
          >
            {copied ? '✓ Copied!' : '🔗 Share'}
          </button>
        </div>
        <div className="h-10 w-px bg-white/10" />
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Task</h2>
          <p className="text-lg font-medium">{roomInfo.current_task}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${isMediator ? 'bg-amber-400' : 'bg-emerald-400'}`}
          />
          <span className="text-sm text-slate-400">{isMediator ? 'Mediator' : 'Participant'}</span>
        </div>
        <button
          onClick={onLeave}
          className="px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-white/5 transition-colors"
        >
          Leave
        </button>
      </div>
    </div>
  );
}
