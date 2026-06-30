import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameStore } from './store/gameStore';
import { useSupabaseRoom } from './hooks/useSupabaseRoom';
import { useRoomActions } from './hooks/useRoomActions';
import { useTasks } from './hooks/useTasks';
import { useGroups } from './hooks/useGroups';
import CreateRoom from './components/ui/CreateRoom';
import JoinRoom from './components/ui/JoinRoom';
import GameTable from './components/canvas/GameTable';
import RoomInfo from './components/ui/RoomInfo';
import VoteResults from './components/ui/VoteResults';
import MediatorControls from './components/ui/MediatorControls';
import ParticipantSidebar from './components/ui/ParticipantSidebar';
import TaskListPanel from './components/ui/TaskListPanel';
import GroupManager from './components/ui/GroupManager';
import TransferMediatorModal from './components/ui/TransferMediatorModal';

function HomeScreen({ onNavigate }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel p-8 w-full max-w-md text-center space-y-6">
        <img src="/logo_agenteresolve.png" alt="Planning Poker" className="h-16 mx-auto" />
        <h1 className="text-4xl font-bold text-glow">Planning Poker</h1>
        <p className="text-slate-400">Real-time sprint planning with your team</p>
        <div className="space-y-3">
          <button onClick={() => onNavigate('create')} className="glass-button w-full text-lg py-4">
            Create Room
          </button>
          <button onClick={() => onNavigate('join')} className="glass-button w-full text-lg py-4">
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}

function RoomScreen({ onLeave }) {
  const { roomInfo, userId, userName, isMediator, participants } = useGameStore();
  const { castVote, leaveRoom } = useSupabaseRoom(roomInfo.id, userId, userName);
  const { kickParticipant, transferMediator, advanceRound } = useRoomActions();
  const handleSelectTask = useCallback(
    async (taskName) => {
      await advanceRound(taskName);
    },
    [advanceRound],
  );
  const { tasks, addTask, updateTask, deleteTask, reorderTasks } = useTasks(roomInfo.id);
  const {
    groups,
    participantGroupMap,
    addGroup,
    renameGroup,
    deleteGroup,
    assignParticipant,
    removeParticipant,
    joinGroup,
  } = useGroups(roomInfo.id);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [bottomHeight, setBottomHeight] = useState(() => {
    const saved = localStorage.getItem('planning-poker-bottom-height');
    return saved ? parseInt(saved, 10) : 200;
  });
  const resizing = useRef(false);

  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      resizing.current = true;
      const startY = e.clientY;
      const startH = bottomHeight;

      const onMouseMove = (ev) => {
        if (!resizing.current) return;
        const delta = startY - ev.clientY;
        const newH = Math.max(120, Math.min(500, startH + delta));
        setBottomHeight(newH);
        localStorage.setItem('planning-poker-bottom-height', newH);
      };

      const onMouseUp = () => {
        resizing.current = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [bottomHeight],
  );

  const handleLeave = useCallback(async () => {
    await leaveRoom();
    onLeave();
  }, [leaveRoom, onLeave]);

  const handleSetFinalScore = useCallback(
    async (taskId, score) => {
      await updateTask(taskId, { final_score: score || null });
    },
    [updateTask],
  );

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="flex-none px-4 pt-4 pb-2">
        <RoomInfo onLeave={handleLeave} tasks={tasks} groups={groups} />
      </div>

      <div className="flex-1 min-h-0 flex gap-0 px-4 pb-0">
        <div className="flex-none w-48">
          <ParticipantSidebar
            onKick={isMediator ? kickParticipant : undefined}
            onOpenTransferModal={isMediator ? () => setShowTransferModal(true) : undefined}
            groups={groups}
            participantGroupMap={participantGroupMap}
            onJoinGroup={joinGroup}
            onOpenGroupManager={isMediator ? () => setShowGroupManager(true) : undefined}
          />
        </div>
        <div className="flex-1 min-w-0 relative rounded-2xl overflow-hidden">
          <GameTable
            onCardClick={castVote}
            tasks={tasks}
            groups={groups}
            participantGroupMap={participantGroupMap}
          />
        </div>
      </div>

      <div className="resize-handle" onMouseDown={handleMouseDown} />

      <div className="bottom-controls" style={{ height: bottomHeight }}>
        <TaskListPanel
          tasks={tasks}
          groups={groups}
          onAdd={addTask}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onReorder={reorderTasks}
          onSelectTask={isMediator ? handleSelectTask : undefined}
          isMediator={isMediator}
        />
        <div className="flex flex-col gap-3 min-w-0">
          <VoteResults groups={groups} participantGroupMap={participantGroupMap} />
          {isMediator && <MediatorControls tasks={tasks} onSetFinalScore={handleSetFinalScore} />}
        </div>
      </div>

      {showGroupManager && (
        <GroupManager
          groups={groups}
          participants={participants}
          participantGroupMap={participantGroupMap}
          onAddGroup={addGroup}
          onRenameGroup={renameGroup}
          onDeleteGroup={deleteGroup}
          onAssignParticipant={assignParticipant}
          onRemoveParticipant={removeParticipant}
          onClose={() => setShowGroupManager(false)}
          isMediator={isMediator}
        />
      )}

      {showTransferModal && (
        <TransferMediatorModal
          participants={participants}
          mediatorId={roomInfo.mediator_id}
          onTransfer={transferMediator}
          onClose={() => setShowTransferModal(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('join');
    if (code) {
      setJoinCode(code.toUpperCase());
      setScreen('join');
      window.history.replaceState({}, '', '/');
      return;
    }

    const { roomInfo } = useGameStore.getState();
    if (roomInfo?.id) {
      setScreen('room');
    }
  }, []);

  const handleRoomCreated = useCallback(() => {
    setScreen('room');
  }, []);

  const handleRoomJoined = useCallback(() => {
    setScreen('room');
  }, []);

  const handleLeaveRoom = useCallback(() => {
    useGameStore.getState().reset();
    setScreen('home');
  }, []);

  if (screen === 'create') return <CreateRoom onCreated={handleRoomCreated} />;
  if (screen === 'join') return <JoinRoom onJoined={handleRoomJoined} initialCode={joinCode} />;
  if (screen === 'room') return <RoomScreen onLeave={handleLeaveRoom} />;
  return <HomeScreen onNavigate={setScreen} />;
}
