import { useState, useMemo, useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { ROOM_STATUS } from '../../lib/constants';
import { cardValueToNumber } from '../../lib/utils';
import Card2D from '../ui/Card2D';
import ConsensusConfetti from './ConsensusConfetti';

function ParticipantSlot({ name, isMediator, voteValue, isRevealed, isLocal, isMin, isMax, cardRevealed, mediatorVoting, style }) {
  return (
    <div className="participant-slot" style={style}>
      <span className={`participant-name-badge ${isMediator ? 'mediator-badge' : ''}`}>
        {isMediator && <span className="mediator-star">★ </span>}
        {name}
        {isLocal && <span className="text-white/60 ml-1 text-[10px]">(você)</span>}
        {isMin && isRevealed && <span className="ml-1 text-[11px]">🐇</span>}
        {isMax && isRevealed && <span className="ml-1 text-[11px]">🐢</span>}
      </span>
      {isMediator && !mediatorVoting ? (
        <div className="mediator-card" />
      ) : (
        <Card2D
          value={voteValue || '?'}
          faceDown={!cardRevealed}
          isRevealed={cardRevealed}
          size="sm"
          disabled
        />
      )}
    </div>
  );
}

export default function GameTable({ onCardClick, tasks, groups, participantGroupMap }) {
  const { votes, localVote, roomInfo, participants, userId, isMediator, mediatorVoting, getDeck } = useGameStore();
  const deck = getDeck();
  const isRevealed = roomInfo.status === ROOM_STATUS.REVEALED;
  const prevStatus = useRef(roomInfo.status);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (prevStatus.current === ROOM_STATUS.REVEALED && roomInfo.status !== ROOM_STATUS.REVEALED) {
      setShowConfetti(false);
    }
    prevStatus.current = roomInfo.status;
  }, [roomInfo.status]);

  const currentTaskObj = tasks.find((t) => t.name === roomInfo.current_task);
  const taskGroupId = currentTaskObj?.group_id || null;

  const participantEntries = useMemo(
    () => Object.entries(participants).filter(([, p]) => p.user_name),
    [participants],
  );

  const slots = useMemo(() => {
    const count = participantEntries.length;
    if (count === 0) return [];
    return participantEntries.map(([key, p], i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      return { key, participant: p, angle };
    });
  }, [participantEntries]);

  const voteMap = useMemo(() => {
    const map = {};
    for (const v of votes) {
      map[v.user_id] = v.vote_value;
    }
    return map;
  }, [votes]);

  const scoreBounds = useMemo(() => {
    if (!isRevealed) return { minVal: null, maxVal: null, minCount: 0, maxCount: 0 };
    const nums = Object.values(voteMap)
      .map((v) => cardValueToNumber(v))
      .filter((v) => v !== null);
    if (nums.length < 2) return { minVal: null, maxVal: null, minCount: 0, maxCount: 0 };
    const minVal = Math.min(...nums);
    const maxVal = Math.max(...nums);
    const minCount = nums.filter((v) => v === minVal).length;
    const maxCount = nums.filter((v) => v === maxVal).length;
    return { minVal, maxVal, minCount, maxCount };
  }, [voteMap, isRevealed]);

  const isInTaskGroup = !taskGroupId || participantGroupMap[userId] === taskGroupId;

  return (
    <div className="game-table">
      {taskGroupId && !isInTaskGroup && !isRevealed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 rounded-2xl">
          <div className="text-center">
            <p className="text-lg font-medium text-white">Waiting for {groups.find((g) => g.id === taskGroupId)?.name || 'assigned'} team</p>
            <p className="text-sm text-slate-400 mt-1">This task is reserved for a specific group.</p>
          </div>
        </div>
      )}

      {/* Participant slots around the table */}
      {slots.map(({ key, participant: p, angle }) => {
        const cx = 50 + Math.cos(angle) * 38;
        const cy = 48 + Math.sin(angle) * 24;
        const voteVal = voteMap[p.user_id] || null;
        const num = cardValueToNumber(voteVal);
        const isMin = scoreBounds.minVal !== null && num === scoreBounds.minVal && scoreBounds.minCount === 1;
        const isMax = scoreBounds.maxVal !== null && num === scoreBounds.maxVal && scoreBounds.maxCount === 1;
        const cardRevealed = isRevealed && voteVal != null;
        return (
          <ParticipantSlot
            key={key}
            name={p.user_name}
            isMediator={p.user_id === roomInfo.mediator_id}
            voteValue={voteVal}
            isRevealed={isRevealed}
            isLocal={p.user_id === userId}
            isMin={isMin}
            isMax={isMax}
            cardRevealed={cardRevealed}
            mediatorVoting={mediatorVoting}
            style={{ left: `${cx}%`, top: `${cy}%` }}
          />
        );
      })}

      {/* Deck row */}
      {(!isMediator || mediatorVoting) && (
        <div className="deck-area">
          <div className="deck-cards">
            {deck.map((value) => (
              <Card2D
                key={value}
                value={value}
                isSelected={value === localVote}
                onClick={() => isInTaskGroup && onCardClick(value)}
                size="md"
              />
            ))}
          </div>
        </div>
      )}

      {isRevealed && !showConfetti && scoreBounds.minVal !== null && scoreBounds.minVal === scoreBounds.maxVal && scoreBounds.minCount >= 2 && (
        <ConsensusConfetti onDone={() => setShowConfetti(true)} />
      )}
    </div>
  );
}
