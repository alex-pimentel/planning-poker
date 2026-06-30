import { useMemo, useState } from 'react';
import { useGameStore } from '../../store/gameStore';

export default function ParticipantSidebar({
  onKick,
  onOpenTransferModal,
  groups,
  participantGroupMap,
  onJoinGroup,
  onOpenGroupManager,
}) {
  const { participants, votes, userId, roomInfo, mediatorVoting, toggleMediatorVoting } =
    useGameStore();
  const [showGroupSelect, setShowGroupSelect] = useState(false);

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

  const { grouped, ungrouped } = useMemo(() => {
    const g = {};
    const ug = [];
    for (const p of entries) {
      const groupId = participantGroupMap[p.user_id];
      const group = groups.find((gr) => gr.id === groupId);
      if (group) {
        if (!g[group.id]) g[group.id] = { group, members: [] };
        g[group.id].members.push(p);
      } else {
        ug.push(p);
      }
    }
    return { grouped: Object.values(g), ungrouped: ug };
  }, [entries, groups, participantGroupMap]);

  const availableGroups = groups.filter((g) => g.id !== participantGroupMap[userId]);

  if (entries.length === 0) return null;

  const renderParticipant = (p) => {
    const hasVoted = p.user_id in votesByUser;
    const isMed = p.user_id === roomInfo.mediator_id;
    const isLocal = p.user_id === userId;
    const canKick = onKick && !isMed && !isLocal;

    const itemClass = `sidebar-item ${isLocal ? 'sidebar-item-local' : ''} ${isMed ? 'sidebar-item-mediator' : ''}`;

    return (
      <div key={p.user_id} className={itemClass}>
        <div className="sidebar-item-left">
          <span className={`sidebar-status ${hasVoted ? 'status-voted' : 'status-pending'}`}>
            {hasVoted ? '✓' : '—'}
          </span>
          <span className="sidebar-name">{p.user_name}</span>
          {isMed && <span className="mediator-tag">Mediator</span>}
        </div>
        <div className="flex items-center gap-1">
          {isMed && onOpenTransferModal && (
            <button
              onClick={onOpenTransferModal}
              className="ml-1 p-0.5 rounded hover:bg-amber-500/20 text-slate-500 hover:text-amber-400 transition-colors"
              title="Transfer mediator to another participant"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </button>
          )}
          {isMed && isLocal && (
            <button
              onClick={toggleMediatorVoting}
              className={`ml-1 p-0.5 rounded transition-colors ${mediatorVoting ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-slate-500 hover:bg-white/10'}`}
              title={mediatorVoting ? 'Disable voting' : 'Enable voting'}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          )}
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
  };

  return (
    <div className="participant-sidebar">
      <div className="flex items-center justify-between">
        <h3 className="sidebar-title">
          Participants
          <span className="sidebar-count">{entries.length}</span>
        </h3>
        {onOpenGroupManager && (
          <button
            onClick={onOpenGroupManager}
            className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 hover:text-white transition-colors"
            title="Manage groups"
          >
            Groups{groups.length > 0 ? ` (${groups.length})` : ''}
          </button>
        )}
      </div>
      <div className="sidebar-list scrollbar-custom">
        {grouped.map(({ group, members }) => (
          <div key={group.id} className="mb-2">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-1">
              {group.name}
              <span className="ml-1 text-slate-600 font-normal">({members.length})</span>
            </div>
            <div className="space-y-0.5">{members.map(renderParticipant)}</div>
          </div>
        ))}

        {ungrouped.length > 0 && (
          <div className="mb-2">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-1">
              Ungrouped
              <span className="ml-1 text-slate-600 font-normal">({ungrouped.length})</span>
            </div>
            <div className="space-y-0.5">{ungrouped.map(renderParticipant)}</div>
          </div>
        )}
      </div>
      {onJoinGroup && availableGroups.length > 0 && (
        <div className="shrink-0 px-3 py-3 border-t border-white/5 space-y-2">
          <button
            onClick={() => setShowGroupSelect(!showGroupSelect)}
            className="w-full text-xs text-slate-400 hover:text-white transition-colors text-left"
          >
            {showGroupSelect ? '— Cancel' : '+ Join group'}
          </button>
          {showGroupSelect && (
            <div className="space-y-1">
              {availableGroups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    onJoinGroup(g.id);
                    setShowGroupSelect(false);
                  }}
                  className="w-full text-xs text-left px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  Join {g.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
