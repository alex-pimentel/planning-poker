import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { ROOM_STATUS } from '../../lib/constants';
import Card2D from '../ui/Card2D';

function ParticipantSlot({ name, isMediator, voteValue, isRevealed, isLocal, style }) {
  return (
    <div className="participant-slot" style={style}>
      <span className={`participant-name-badge ${isMediator ? 'mediator-badge' : ''}`}>
        {isMediator && <span className="mediator-star">★ </span>}
        {name}
        {isLocal && <span className="text-white/60 ml-1 text-[10px]">(você)</span>}
      </span>
      <Card2D
        value={voteValue || '?'}
        faceDown={!isRevealed}
        isRevealed={isRevealed}
        size="sm"
        disabled
      />
    </div>
  );
}

export default function GameTable({ onCardClick }) {
  const { votes, localVote, roomInfo, participants, userId, getDeck } = useGameStore();
  const deck = getDeck();
  const isRevealed = roomInfo.status === ROOM_STATUS.REVEALED;

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

  return (
    <div className="game-table">
      {/* Participant slots around the table */}
      {slots.map(({ key, participant: p, angle }) => {
        const cx = 50 + Math.cos(angle) * 38;
        const cy = 48 + Math.sin(angle) * 24;
        return (
          <ParticipantSlot
            key={key}
            name={p.user_name}
            isMediator={p.user_id === roomInfo.mediator_id}
            voteValue={voteMap[p.user_id] || null}
            isRevealed={isRevealed}
            isLocal={p.user_id === userId}
            style={{ left: `${cx}%`, top: `${cy}%` }}
          />
        );
      })}

      {/* Deck row */}
      <div className="deck-area">
        <div className="deck-cards">
          {deck.map((value) => (
            <Card2D
              key={value}
              value={value}
              isSelected={value === localVote}
              onClick={() => onCardClick(value)}
              size="md"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
