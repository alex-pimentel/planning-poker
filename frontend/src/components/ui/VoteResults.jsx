import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { ROOM_STATUS } from '../../lib/constants';
import { cardValueToNumber } from '../../lib/utils';

export default function VoteResults({ groups, participantGroupMap }) {
  const { votes, participants, roomInfo } = useGameStore();
  const isRevealed = roomInfo.status === ROOM_STATUS.REVEALED;

  const currentTaskObj = useGameStore((s) => s.tasks).find((t) => t.name === roomInfo.current_task);
  const taskGroup = currentTaskObj?.group_id
    ? groups.find((g) => g.id === currentTaskObj.group_id)
    : null;

  const eligibleParticipantIds = useMemo(() => {
    const allIds = Object.keys(participants).filter((id) => participants[id].user_name);
    if (taskGroup) {
      return allIds.filter((id) => participantGroupMap[id] === taskGroup.id);
    }
    return allIds;
  }, [participants, taskGroup, participantGroupMap]);

  const presentVotes = useMemo(() => {
    let filtered = votes.filter((v) => v.user_id in participants);
    if (taskGroup) {
      filtered = filtered.filter((v) => eligibleParticipantIds.includes(v.user_id));
    }
    return filtered;
  }, [votes, participants, taskGroup, eligibleParticipantIds]);

  const stats = useMemo(() => {
    const total = eligibleParticipantIds.length;
    if (total === 0) return null;
    const voted = presentVotes.filter((v) => v.vote_value != null);
    const numericValues = voted
      .map((v) => cardValueToNumber(v.vote_value))
      .filter((v) => v !== null);

    const sum = numericValues.reduce((a, b) => a + b, 0);
    const avg = numericValues.length > 0 ? (sum / numericValues.length).toFixed(1) : '-';

    let minVal = null;
    let maxVal = null;
    let minCount = 0;
    let maxCount = 0;
    if (numericValues.length >= 2) {
      minVal = Math.min(...numericValues);
      maxVal = Math.max(...numericValues);
      minCount = numericValues.filter((v) => v === minVal).length;
      maxCount = numericValues.filter((v) => v === maxVal).length;
    }

    return { total, voted: voted.length, avg, minVal, maxVal, minCount, maxCount };
  }, [eligibleParticipantIds, presentVotes]);

  const highlightMin = stats && stats.minVal !== null && stats.minCount === 1 && stats.minVal !== stats.maxVal;
  const highlightMax = stats && stats.maxVal !== null && stats.maxCount === 1 && stats.minVal !== stats.maxVal;

  const voteStyle = (vote) => {
    if (!isRevealed) return 'bg-white/5 border border-white/10';
    if (vote.vote_value == null) return 'bg-red-500/10 border border-red-500/20';
    const num = cardValueToNumber(vote.vote_value);
    if (highlightMin && num === stats.minVal) return 'bg-amber-500/20 border border-amber-500/30';
    if (highlightMax && num === stats.maxVal) return 'bg-red-500/15 border border-red-500/25';
    return 'bg-white/5 border border-white/10';
  };

  if (!eligibleParticipantIds.length) return null;

  return (
    <div className="glass-panel p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="panel-title">Votes</h3>
        {stats && (
          <span className="text-[10px] text-slate-500">
            <span className="text-white font-medium">{stats.voted}</span>
            <span className="text-slate-600">/{stats.total}</span>
            <span className="text-slate-600 ml-1">voted</span>
          </span>
        )}
      </div>

      {taskGroup && (
        <div className="text-[10px] text-slate-500">
          Group: <span className="text-white font-medium">{taskGroup.name}</span>
        </div>
      )}

      {isRevealed && stats && stats.voted > 0 && (
        <div className="flex gap-3 text-xs">
          <div className="px-2 py-1 rounded-lg bg-white/5">
            <span className="text-slate-500">Average: </span>
            <span className="text-white font-bold">{stats.avg}</span>
          </div>
          {stats.minVal !== null && (
            <div className="px-2 py-1 rounded-lg bg-white/5 flex items-center gap-1">
              <span className="text-slate-500">Min: </span>
              <span className="text-amber-400 font-bold">{stats.minVal}</span>
            </div>
          )}
          {stats.maxVal !== null && (
            <div className="px-2 py-1 rounded-lg bg-white/5 flex items-center gap-1">
              <span className="text-slate-500">Max: </span>
              <span className="text-red-400 font-bold">{stats.maxVal}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {presentVotes.map((vote) => {
          const participant = Object.values(participants).find((p) => p.user_id === vote.user_id);
          const name = participant?.user_name || vote.user_name;
          const isMed = vote.user_id === roomInfo.mediator_id;
          const num = isRevealed ? cardValueToNumber(vote.vote_value) : null;
          const isMin = highlightMin && num === stats.minVal;
          const isMax = highlightMax && num === stats.maxVal;

          return (
            <div
              key={vote.id}
              className={`px-2.5 py-1.5 rounded-xl text-center text-xs min-w-[52px] transition-all duration-300 ${voteStyle(vote)}`}
            >
              <div className="font-bold text-sm">
                {isRevealed ? vote.vote_value ?? '—' : '?'}
              </div>
              <div className="text-[10px] text-slate-500 truncate max-w-[52px]">
                {name}
                {isMed ? ' ★' : ''}
              </div>
              <div className="text-[10px] mt-0.5">
                {isMin && <span className="text-amber-400">🐇</span>}
                {isMax && <span className="text-red-400">🐢</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
