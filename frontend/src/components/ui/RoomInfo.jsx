import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { supabase } from '../../lib/supabase';

export default function RoomInfo({ onLeave, tasks, groups }) {
  const { roomInfo, isMediator } = useGameStore();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const currentTaskIndex = tasks.findIndex((t) => t.name === roomInfo.current_task);
  const currentTaskObj = tasks.find((t) => t.name === roomInfo.current_task);
  const taskGroup = currentTaskObj?.group_id
    ? groups.find((g) => g.id === currentTaskObj.group_id)
    : null;

  const copyInviteLink = async () => {
    const link = `${window.location.origin}/?join=${roomInfo.room_code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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

  const handleStartEdit = () => {
    setEditName(roomInfo.current_task);
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (editName.trim() && editName.trim() !== roomInfo.current_task) {
      const userId = useGameStore.getState().userId;
      await supabase
        .from('rooms')
        .update({ current_task: editName.trim() })
        .eq('id', roomInfo.id)
        .eq('mediator_id', userId);
      useGameStore.getState().setRoomInfo({ current_task: editName.trim() });
      if (currentTaskObj) {
        await supabase
          .from('tasks')
          .update({ name: editName.trim() })
          .eq('id', currentTaskObj.id);
      }
    }
    setEditing(false);
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
          <div className="flex items-center gap-2">
            {editing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                className="px-2 py-0.5 rounded bg-white/10 text-white text-lg font-medium
                           focus:outline-none focus:ring-1 focus:ring-poker-500"
                autoFocus
              />
            ) : (
              <p
                className={`text-lg font-medium ${isMediator ? 'cursor-pointer hover:text-poker-400' : ''}`}
                onClick={isMediator ? handleStartEdit : undefined}
                title={isMediator ? 'Click to edit' : undefined}
              >
                {roomInfo.current_task}
              </p>
            )}
            {taskGroup && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-slate-400 shrink-0">
                {taskGroup.name}
              </span>
            )}
            {tasks.length > 0 && (
              <span className="text-xs text-slate-500">
                {currentTaskIndex >= 0 ? `${currentTaskIndex + 1}/${tasks.length}` : `—/${tasks.length}`}
              </span>
            )}
          </div>
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
