import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useRoomActions } from '../../hooks/useRoomActions';
import Select from './Select';

const DECK_OPTIONS = [
  { value: 'fibonacci', label: 'Fibonacci (0, 1, 2, 3, 5, 8, 13, 21, 34, ?)' },
  { value: 'tshirt', label: 'T-Shirt (XS, S, M, L, XL, XXL, ?)' },
  { value: 'powers2', label: 'Powers of 2 (0, 1, 2, 4, 8, 16, 32, 64, ?)' },
];

export default function CreateRoom({ onCreated, onBack }) {
  const [userName, setUserName] = useState('');
  const [deckType, setDeckType] = useState('fibonacci');
  const [loading, setLoading] = useState(false);
  const { error, setUserName: storeSetUserName } = useGameStore();
  const { createRoom } = useRoomActions();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userName.trim()) return;
    setLoading(true);
    const result = await createRoom(userName.trim(), deckType);
    setLoading(false);
    if (result) {
      storeSetUserName(userName.trim());
      onCreated?.(result);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel p-8 w-full max-w-md">
        <a
          href="http://www.agenteresolve.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="block p-2 mb-5"
        >
          <img src="/logo_agenteresolve.png" alt="Planning Poker" className="h-12 mx-auto" />
        </a>

        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => onBack?.()}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">Create Room</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Your Name</label>
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

          <div>
            <Select
              value={deckType}
              onChange={setDeckType}
              options={DECK_OPTIONS}
              label="Deck Type"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !userName.trim()}
            className="glass-button w-full"
          >
            {loading ? 'Creating Room...' : 'Create Room'}
          </button>
        </form>
      </div>
    </div>
  );
}
