import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { useGameStore } from '../src/store/gameStore';
import { ROOM_STATUS } from '../src/lib/constants';

const { mockSupabase, roomsState } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
  roomsState: {
    row: null,
    votes: [],
  },
}));

vi.mock('../src/lib/supabase', () => ({
  supabase: mockSupabase,
  ensureAnonAuth: vi.fn(),
}));

import { useSupabaseRoom } from '../src/hooks/useSupabaseRoom';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function Harness() {
  useSupabaseRoom('room-1', 'user-1', 'Alex');
  return null;
}

function createFakeChannel() {
  const channel = {
    on: vi.fn(() => channel),
    subscribe: vi.fn((callback) => {
      if (callback) callback('SUBSCRIBED');
      return channel;
    }),
    track: vi.fn().mockResolvedValue('ok'),
    presenceState: vi.fn(() => ({})),
    send: vi.fn().mockResolvedValue('ok'),
    state: 'joined',
  };
  return channel;
}

async function flushMicrotasks() {
  for (let i = 0; i < 5; i += 1) {
    await Promise.resolve();
  }
}

describe('useSupabaseRoom', () => {
  let root;
  let container;

  beforeEach(() => {
    vi.useFakeTimers();

    useGameStore.getState().reset();
    useGameStore.getState().setRoomInfo({
      id: 'room-1',
      status: ROOM_STATUS.VOTING,
      mediator_id: 'user-1',
      updated_at: '2026-11-10T00:00:00.000Z',
    });
    useGameStore.getState().setUserId('user-1');
    useGameStore.getState().setUserName('Alex');

    roomsState.row = {
      id: 'room-1',
      status: ROOM_STATUS.VOTING,
      mediator_id: 'user-1',
      updated_at: '2026-11-10T00:00:00.000Z',
    };
    roomsState.votes = [];

    mockSupabase.channel.mockImplementation(() => createFakeChannel());
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'rooms') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: roomsState.row, error: null }),
            }),
          }),
        };
      }
      if (table === 'votes') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: roomsState.votes, error: null }),
          }),
        };
      }
      return {};
    });

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(createElement(Harness)));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('reconciles room status by polling when the Realtime event is missed', async () => {
    expect(useGameStore.getState().roomInfo.status).toBe(ROOM_STATUS.VOTING);

    // The mediator revealed the cards in the database, but this client's
    // Postgres Changes event was dropped.
    roomsState.row = {
      ...roomsState.row,
      status: ROOM_STATUS.REVEALED,
      updated_at: '2026-11-10T00:00:05.000Z',
    };

    await act(async () => {
      vi.advanceTimersByTime(5000);
      await flushMicrotasks();
    });

    expect(useGameStore.getState().roomInfo.status).toBe(ROOM_STATUS.REVEALED);
  });

  it('keeps the local vote selected during routine polling', async () => {
    useGameStore.getState().setLocalVote('5');

    await act(async () => {
      vi.advanceTimersByTime(5000);
      await flushMicrotasks();
    });

    expect(useGameStore.getState().localVote).toBe('5');
  });
});
