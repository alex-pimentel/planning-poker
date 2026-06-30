import { useState, useMemo, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import Select from './Select';
import ConfirmModal from './ConfirmModal';
import { exportPdf } from '../../utils/exportPdf';

export default function TaskListPanel({
  tasks,
  groups,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
  onSelectTask,
  isMediator,
}) {
  const { roomInfo, userName } = useGameStore();
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskGroup, setNewTaskGroup] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [exporting, setExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // task object when confirming
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const handleAdd = () => {
    if (!newTaskName.trim()) return;
    onAdd(newTaskName.trim(), newTaskGroup || null);
    setNewTaskName('');
    setNewTaskGroup('');
  };

  const handleStartEdit = (task) => {
    setEditingId(task.id);
    setEditName(task.name);
  };

  const handleSaveEdit = (taskId) => {
    if (editName.trim()) {
      onUpdate(taskId, { name: editName.trim() });
    }
    setEditingId(null);
    setEditName('');
  };

  const handleDragStart = (index) => {
    dragItem.current = index;
  };

  const handleDragOver = (index) => {
    dragOverItem.current = index;
  };

  const handleDrop = () => {
    if (dragItem.current == null || dragOverItem.current == null) return;
    if (dragItem.current === dragOverItem.current) return;
    const reordered = [...tasks];
    const [removed] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, removed);
    onReorder(reordered.map((t) => t.id));
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const currentTaskName = roomInfo.current_task;

  const sortedTasks = useMemo(() => {
    const completed = tasks.filter((t) => t.final_score);
    const pending = tasks.filter((t) => !t.final_score);
    return [...completed, ...pending];
  }, [tasks]);

  if (tasks.length === 0 && !isMediator) return null;

  return (
    <div className="glass-panel p-3 flex flex-col min-h-0">
      <div className="flex items-center justify-between shrink-0">
        <h3 className="panel-title">
          Tasks{' '}
          {tasks.length > 0 && <span className="text-slate-600 font-normal">({tasks.length})</span>}
        </h3>
        <div className="flex items-center gap-1.5">
          {tasks.some((t) => t.final_score) && (
            <button
              onClick={async () => {
                setExporting(true);
                await new Promise((r) => setTimeout(r, 50));
                exportPdf({ roomCode: roomInfo.room_code, userName, tasks, groups });
                setExporting(false);
              }}
              disabled={exporting}
              className="glass-button text-xs px-2 py-1 rounded-md shrink-0"
            >
              {exporting ? 'Gerando...' : 'Exportar PDF'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col min-h-0 flex-1 mt-2 overflow-hidden">
        {isMediator && (
          <div className="flex gap-1.5 shrink-0">
            <input
              type="text"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Add task..."
              className="flex-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10
                           text-white placeholder-slate-500 text-xs
                           focus:outline-none focus:ring-1 focus:ring-poker-500"
            />
            {groups.length > 0 && (
              <Select
                value={newTaskGroup}
                placeholder="All groups"
                compact
                options={[
                  { value: '', label: 'All groups' },
                  ...groups.map((g) => ({ value: g.id, label: g.name })),
                ]}
                onChange={setNewTaskGroup}
                className="w-28"
              />
            )}
            <button onClick={handleAdd} className="glass-button text-xs px-2 py-1 rounded-md">
              Add
            </button>
          </div>
        )}

        {sortedTasks.length > 0 && (
          <div className="space-y-0.5 overflow-y-auto flex-1 min-h-0 mt-2 scrollbar-custom">
            {sortedTasks.map((task, index) => {
              const isCurrent = task.name === currentTaskName;
              const isEditing = editingId === task.id;
              const taskGroup = groups.find((g) => g.id === task.group_id);
              const isInitial = task.sort_order === 0;

              return (
                <div
                  key={task.id}
                  draggable={isMediator}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    handleDragOver(index);
                  }}
                  onDrop={handleDrop}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-all
                      ${isCurrent ? 'bg-transparent border border-poker-500/40' : isInitial ? 'bg-white/[0.07] border border-white/10' : 'bg-white/5 border border-white/5'}
                      ${isMediator ? 'cursor-grab active:cursor-grabbing' : ''}`}
                >
                  <span className="text-slate-600 text-[10px] w-3 shrink-0">{index + 1}.</span>

                  {isEditing ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleSaveEdit(task.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(task.id)}
                      className="flex-1 px-1.5 py-0.5 rounded bg-white/10 text-white text-xs
                                   focus:outline-none focus:ring-1 focus:ring-poker-500"
                      autoFocus
                    />
                  ) : (
                    <span
                      className={`flex-1 truncate ${isCurrent ? 'text-white font-medium' : 'text-slate-300'}`}
                      onDoubleClick={() => isMediator && handleStartEdit(task)}
                    >
                      {task.name}
                    </span>
                  )}

                  {isInitial && !isCurrent && (
                    <span className="text-[9px] px-1 py-0.5 rounded-full bg-white/10 text-slate-500 shrink-0">
                      Inicial
                    </span>
                  )}

                  {taskGroup && (
                    <span className="text-[9px] px-1 py-0.5 rounded-full bg-white/10 text-slate-400 shrink-0">
                      {taskGroup.name}
                    </span>
                  )}

                  {task.final_score && (
                    <span className="text-[10px] font-bold text-emerald-400 shrink-0">
                      {task.final_score}
                    </span>
                  )}

                  {isCurrent && (
                    <span className="text-[9px] text-poker-400 font-medium shrink-0">◉</span>
                  )}

                  {!isCurrent && !task.final_score && onSelectTask && (
                    <button
                      onClick={() => onSelectTask(task.name)}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-poker-500/20 text-poker-300 hover:bg-poker-500/30 shrink-0 transition-colors"
                      title="Vote on this task"
                    >
                      Vote
                    </button>
                  )}

                  {isMediator && (
                    <div className="flex gap-0.5 shrink-0">
                      {!isEditing && (
                        <button
                          onClick={() => handleStartEdit(task)}
                          className="p-0.5 rounded hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                          title="Edit name"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteConfirm(task)}
                        className="p-0.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete task"
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tasks.length === 0 && isMediator && (
          <p className="text-[10px] text-slate-500 italic mt-2">
            No tasks yet. Add tasks to plan your sprint.
          </p>
        )}
      </div>

      {deleteConfirm && (
        <ConfirmModal
          title="Delete task"
          message={
            <>
              Delete task <span className="text-white font-medium">{deleteConfirm.name}</span>?
            </>
          }
          confirmLabel="Confirm"
          danger
          onConfirm={() => {
            onDelete(deleteConfirm.id);
            setDeleteConfirm(null);
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
