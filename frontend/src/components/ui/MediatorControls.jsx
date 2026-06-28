import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useRoomActions } from '../../hooks/useRoomActions';
import { ROOM_STATUS } from '../../lib/constants';

export default function MediatorControls() {
  const { isMediator, roomInfo, votes } = useGameStore();
  const { revealVotes, resetRound } = useRoomActions();
  const [taskInput, setTaskInput] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);

  if (!isMediator) return null;

  const isVoting = roomInfo.status === ROOM_STATUS.VOTING;
  const hasVotes = votes.length > 0;

  const handleReset = () => {
    if (showTaskInput) {
      resetRound(taskInput.trim() || undefined);
      setTaskInput('');
      setShowTaskInput(false);
    } else {
      setShowTaskInput(true);
    }
  };

  return (
    <div className="glass-panel p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-300">Mediator Controls</h3>

      <div className="flex gap-2">
        {isVoting && hasVotes && (
          <button onClick={revealVotes} className="glass-button flex-1">
            Reveal Votes
          </button>
        )}

        {!isVoting && (
          <button onClick={handleReset} className="glass-button flex-1">
            New Round
          </button>
        )}
      </div>

      {showTaskInput && (
        <div className="flex gap-2">
          <input
            type="text"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder="New task name (optional)"
            className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10
                       text-white placeholder-slate-500 text-sm
                       focus:outline-none focus:ring-2 focus:ring-poker-500"
            autoFocus
          />
          <button
            onClick={() => {
              resetRound(taskInput.trim() || undefined);
              setTaskInput('');
              setShowTaskInput(false);
            }}
            className="glass-button"
          >
            Start
          </button>
        </div>
      )}
    </div>
  );
}
