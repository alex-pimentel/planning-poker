import { useState, useCallback } from 'react';
import Select from './Select';

export default function GroupManager({
  groups,
  participants,
  participantGroupMap,
  onAddGroup,
  onRenameGroup,
  onDeleteGroup,
  onAssignParticipant,
  onRemoveParticipant,
  onClose,
  isMediator,
}) {
  const [newGroupName, setNewGroupName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [selectionKey, setSelectionKey] = useState(0);

  const handleAdd = () => {
    if (!newGroupName.trim()) return;
    onAddGroup(newGroupName.trim());
    setNewGroupName('');
  };

  const handleStartRename = (group) => {
    setEditingId(group.id);
    setEditName(group.name);
  };

  const handleSaveRename = (groupId) => {
    if (editName.trim()) {
      onRenameGroup(groupId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  const handleAssign = useCallback(
    (userId, groupId) => {
      if (!userId) return;
      onAssignParticipant(userId, groupId);
    },
    [onAssignParticipant],
  );

  const groupedParticipants = {};
  const ungrouped = [];
  for (const p of Object.values(participants)) {
    if (!p.user_name) continue;
    const gId = participantGroupMap[p.user_id];
    if (gId && groups.find((g) => g.id === gId)) {
      if (!groupedParticipants[gId]) groupedParticipants[gId] = [];
      groupedParticipants[gId].push(p);
    } else {
      ungrouped.push(p);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="glass-panel p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Manage Groups</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {isMediator && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="New group name..."
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10
                         text-white placeholder-slate-500 text-sm
                         focus:outline-none focus:ring-2 focus:ring-poker-500"
              autoFocus
            />
            <button onClick={handleAdd} className="glass-button text-sm">
              Add Group
            </button>
          </div>
        )}

        {groups.length === 0 && (
          <p className="text-sm text-slate-400 italic">
            {isMediator
              ? 'Create your first group to organize participants.'
              : 'No groups have been created yet.'}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => {
            const members = groupedParticipants[group.id] || [];
            const isEditing = editingId === group.id;

            return (
              <div
                key={group.id}
                className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2"
              >
                <div className="flex items-center justify-between">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleSaveRename(group.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(group.id)}
                      className="flex-1 px-2 py-0.5 rounded bg-white/10 text-white text-sm font-medium
                                 focus:outline-none focus:ring-1 focus:ring-poker-500"
                      autoFocus
                    />
                  ) : (
                    <h4 className="text-sm font-semibold text-white">{group.name}</h4>
                  )}
                  <div className="flex gap-1">
                    {isMediator && (
                      <>
                        <button
                          onClick={() => handleStartRename(group)}
                          className="p-0.5 rounded hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                          title="Rename"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteGroup(group.id)}
                          className="p-0.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete group"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
                  {members.map((p) => (
                    <span
                      key={p.user_id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-xs text-slate-300"
                    >
                      {p.user_name}
                      {isMediator && (
                        <button
                          onClick={() => onRemoveParticipant(p.user_id)}
                          className="hover:text-red-400 transition-colors"
                          title="Remove from group"
                        >
                          <svg
                            className="w-2.5 h-2.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </span>
                  ))}
                  {members.length === 0 && (
                    <span className="text-xs text-slate-600 italic">No members</span>
                  )}
                </div>

                {isMediator && ungrouped.length > 0 && (
                  <div className="pt-1 border-t border-white/5">
                    <Select
                      key={`${group.id}-${selectionKey}`}
                      value=""
                      placeholder="Add participant..."
                      options={ungrouped.map((p) => ({
                        value: p.user_id,
                        label: p.user_name,
                      }))}
                      onChange={(userId) => {
                        handleAssign(userId, group.id);
                        setSelectionKey((k) => k + 1);
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {ungrouped.length > 0 && (
          <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-2">
            <h4 className="text-sm font-semibold text-slate-400">Ungrouped</h4>
            <div className="flex flex-wrap gap-1.5">
              {ungrouped.map((p) => (
                <span
                  key={p.user_id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-xs text-slate-400"
                >
                  {p.user_name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
