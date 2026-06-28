import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';

export default function ParticipantSidebar({ onKick }) {
  const { participants, votes, userId, roomInfo } = useGameStore();

  const votesByUser = useMemo(() => {
    const map = {};
    for (const v of votes) {
      map[v.user_id] = v.vote_value;
    }
    return map;
  }, [votes]);

  const entries = useMemo(
    () => Object.values(participants).filter((p) => p.user_name),
    [participants],
  );

  if (entries.length === 0) return null;

  return (
    <div className="participant-sidebar">
      <h3 className="sidebar-title">
        Participants
        <span className="sidebar-count">{entries.length}</span>
      </h3>
      <div className="sidebar-list">
        {entries.map((p) => {
          const hasVoted = p.user_id in votesByUser;
          const isMed = p.user_id === roomInfo.mediator_id;
          const isLocal = p.user_id === userId;
          const canKick = onKick && !isMed && !isLocal;
          return (
            <div key={p.user_id} className={`sidebar-item ${isLocal ? 'sidebar-item-local' : ''}`}>
              <div className="sidebar-item-left">
                <span className={`sidebar-dot ${hasVoted ? 'dot-voted' : 'dot-pending'}`} />
                <span className="sidebar-name">{p.user_name}</span>
                {isMed && <span className="mediator-star text-[10px]">★</span>}
              </div>
              <div className="flex items-center gap-1">
                <span className={`sidebar-status ${hasVoted ? 'status-voted' : 'status-pending'}`}>
                  {hasVoted ? '✓' : '—'}
                </span>
                {canKick && (
                  <button
                    onClick={() => onKick(p.user_id)}
                    className="ml-1 p-0.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                    title="Remove participant"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
