import { useState, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useRoomActions } from '../../hooks/useRoomActions';
import { ROOM_STATUS } from '../../lib/constants';
import { cardValueToNumber } from '../../lib/utils';

export default function MediatorControls({ tasks, onSetFinalScore }) {
  const { isMediator, roomInfo, votes } = useGameStore();
  const { revealVotes, advanceRound, resetRound } = useRoomActions();
  const [taskInput, setTaskInput] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [finalScore, setFinalScore] = useState('');

  const isVoting = roomInfo.status === ROOM_STATUS.VOTING;
  const isRevealed = roomInfo.status === ROOM_STATUS.REVEALED;
  const hasVotes = votes.length > 0;
  const hasTasks = tasks.length > 0;

  const currentTaskObj = tasks.find((t) => t.name === roomInfo.current_task);
  const currentTaskIndex = tasks.findIndex((t) => t.name === roomInfo.current_task);
  const hasNextTask = currentTaskIndex >= 0 && currentTaskIndex < tasks.length - 1;

  const averageScore = useMemo(() => {
    if (!isRevealed || !votes.length) return '';
    const numericValues = votes
      .map((v) => cardValueToNumber(v.vote_value))
      .filter((v) => v !== null);
    if (numericValues.length === 0) return '';
    const sum = numericValues.reduce((a, b) => a + b, 0);
    return (sum / numericValues.length).toFixed(1);
  }, [isRevealed, votes]);

  if (!isMediator) return null;

  const handleConfirmScore = async () => {
    if (currentTaskObj) {
      const score = finalScore.trim() || null;
      await onSetFinalScore(currentTaskObj.id, score);
    }
    if (hasNextTask) {
      const nextTask = tasks[currentTaskIndex + 1];
      await advanceRound(nextTask.name);
    } else {
      await advanceRound();
    }
    setFinalScore('');
  };

  const handleNewRound = () => {
    if (showTaskInput) {
      resetRound(taskInput.trim() || undefined);
      setTaskInput('');
      setShowTaskInput(false);
    } else {
      setShowTaskInput(true);
    }
  };

  return (
    <div className="glass-panel p-3 space-y-2">
      <h3 className="panel-title">Mediator</h3>

      <div className="flex gap-1.5">
        {isVoting && hasVotes && (
          <button onClick={revealVotes} className="glass-button flex-1 text-xs px-3 py-1.5">
            Reveal
          </button>
        )}

        {isRevealed && hasTasks && (
          <div className="w-full space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] text-slate-500">Score:</label>
              <input
                type="text"
                value={finalScore}
                onChange={(e) => setFinalScore(e.target.value)}
                placeholder={averageScore ? `avg ${averageScore}` : 'Score'}
                className="w-16 px-1.5 py-0.5 rounded-lg bg-white/5 border border-white/10
                           text-white placeholder-slate-500 text-xs text-center
                           focus:outline-none focus:ring-1 focus:ring-poker-500"
              />
            </div>
            <button onClick={handleConfirmScore} className="glass-button w-full text-xs px-3 py-1.5">
              {hasNextTask ? 'Confirm & Next' : 'Confirm & New'}
            </button>
          </div>
        )}

        {isRevealed && !hasTasks && (
          <button onClick={handleNewRound} className="glass-button flex-1 text-xs px-3 py-1.5">
            New Round
          </button>
        )}
      </div>

      {showTaskInput && (
        <div className="flex gap-1.5">
          <input
            type="text"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder="New task name"
            className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10
                       text-white placeholder-slate-500 text-xs
                       focus:outline-none focus:ring-1 focus:ring-poker-500"
            autoFocus
          />
          <button
            onClick={() => {
              resetRound(taskInput.trim() || undefined);
              setTaskInput('');
              setShowTaskInput(false);
            }}
            className="glass-button text-xs px-3 py-1.5"
          >
            Start
          </button>
        </div>
      )}
    </div>
  );
}
