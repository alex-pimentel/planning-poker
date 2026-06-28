import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { ROOM_STATUS } from '../../lib/constants';
import { cardValueToNumber } from '../../lib/utils';

export default function VoteResults() {
  const { votes, participants, roomInfo } = useGameStore();
  const isRevealed = roomInfo.status === ROOM_STATUS.REVEALED;

  const presentVotes = useMemo(
    () => votes.filter((v) => v.user_id in participants),
    [votes, participants],
  );

  const stats = useMemo(() => {
    if (!presentVotes?.length) return null;
    const total = presentVotes.length;
    const voted = presentVotes.filter((v) => v.vote_value != null);
    const numericValues = voted
      .map((v) => cardValueToNumber(v.vote_value))
      .filter((v) => v !== null);

    const sum = numericValues.reduce((a, b) => a + b, 0);
    const avg = numericValues.length > 0 ? (sum / numericValues.length).toFixed(1) : '-';

    return { total, voted: voted.length, avg, values: numericValues };
  }, [presentVotes]);

  if (!presentVotes?.length) return null;

  return (
    <div className="glass-panel p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-300">Votes</h3>

      {isRevealed && stats && (
        <div className="flex gap-4 text-sm">
          <div className="px-3 py-1 rounded-lg bg-white/5">
            <span className="text-slate-400">Average: </span>
            <span className="text-white font-bold">{stats.avg}</span>
          </div>
          <div className="px-3 py-1 rounded-lg bg-white/5">
            <span className="text-slate-400">Voted: </span>
            <span className="text-white font-bold">
              {stats.voted}/{stats.total}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {presentVotes.map((vote) => {
          const participant = Object.values(participants).find((p) => p.user_id === vote.user_id);
          const name = participant?.user_name || vote.user_name;
          const isMed = vote.user_id === roomInfo.mediator_id;

          return (
            <div
              key={vote.id}
              className={`px-3 py-2 rounded-xl text-center text-sm min-w-[60px] transition-all duration-300 ${
                isRevealed && vote.vote_value
                  ? 'bg-emerald-500/20 border border-emerald-500/30'
                  : isRevealed && !vote.vote_value
                    ? 'bg-red-500/10 border border-red-500/20'
                    : 'bg-white/5 border border-white/10'
              }`}
            >
              <div className="font-bold text-lg">{isRevealed ? (vote.vote_value ?? '—') : '✓'}</div>
              <div className="text-xs text-slate-400 truncate max-w-[60px]">
                {name}
                {isMed ? ' ★' : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
