import { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { useRoomActions } from "../../hooks/useRoomActions";

export default function JoinRoom({ onJoined, initialCode = "" }) {
  const [roomCode, setRoomCode] = useState(initialCode);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const { error, setUserName: storeSetUserName } = useGameStore();
  const { joinRoom } = useRoomActions();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roomCode.trim() || !userName.trim()) return;
    setLoading(true);
    const result = await joinRoom(roomCode.trim());
    setLoading(false);
    if (result) {
      storeSetUserName(userName.trim());
      onJoined?.(result);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">Join Room</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-character code"
              maxLength={6}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                         text-white placeholder-slate-500 uppercase tracking-widest text-center text-lg
                         focus:outline-none focus:ring-2 focus:ring-poker-500
                         focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              maxLength={30}
              required
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                         text-white placeholder-slate-500 focus:outline-none focus:ring-2
                         focus:ring-poker-500 focus:border-transparent transition-all"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !roomCode.trim() || !userName.trim()}
            className="glass-button w-full"
          >
            {loading ? "Joining..." : "Join Room"}
          </button>
        </form>
      </div>
    </div>
  );
}
