import { useState, useCallback, useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { useSupabaseRoom } from './hooks/useSupabaseRoom';
import { useRoomActions } from './hooks/useRoomActions';
import CreateRoom from './components/ui/CreateRoom';
import JoinRoom from './components/ui/JoinRoom';
import GameTable from './components/canvas/GameTable';
import RoomInfo from './components/ui/RoomInfo';
import VoteResults from './components/ui/VoteResults';
import MediatorControls from './components/ui/MediatorControls';
import ParticipantSidebar from './components/ui/ParticipantSidebar';

function HomeScreen({ onNavigate }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel p-8 w-full max-w-md text-center space-y-6">
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
  const { roomInfo, userId, userName, isMediator } = useGameStore();
  const { castVote, leaveRoom } = useSupabaseRoom(roomInfo.id, userId, userName);
  const { kickParticipant } = useRoomActions();

  const handleLeave = useCallback(async () => {
    await leaveRoom();
    onLeave();
  }, [leaveRoom, onLeave]);

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="flex-none px-4 pt-4 pb-2">
        <RoomInfo onLeave={handleLeave} />
      </div>

      <div className="flex-1 min-h-0 flex gap-0 px-4 pb-2">
        <div className="flex-none w-48">
          <ParticipantSidebar onKick={isMediator ? kickParticipant : undefined} />
        </div>
        <div className="flex-1 min-w-0 relative rounded-2xl overflow-hidden">
          <GameTable onCardClick={castVote} />
        </div>
      </div>

      <div className="bottom-controls">
        <div className="space-y-3">
          <VoteResults />
          {isMediator && <MediatorControls />}
        </div>
      </div>
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

    // Restore session on refresh
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
