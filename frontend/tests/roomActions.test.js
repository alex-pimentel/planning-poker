import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { useGameStore } from '../src/store/gameStore';
import { ROOM_STATUS } from '../src/lib/constants';

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

vi.mock('../src/lib/supabase', () => ({
  supabase: mockSupabase,
  ensureAnonAuth: vi.fn(),
}));

import { useRoomActions } from '../src/hooks/useRoomActions';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let actions;

function Harness() {
  actions = useRoomActions();
  return null;
}

function mockRoomUpdateResult(result) {
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn(() => ({ single }));
  const eqMediator = vi.fn(() => ({ select }));
  const eqId = vi.fn(() => ({ eq: eqMediator }));
  const update = vi.fn(() => ({ eq: eqId }));

  mockSupabase.from.mockReturnValue({ update });

  return { update, eqId, eqMediator, select, single };
}

describe('useRoomActions.revealVotes', () => {
  let root;
  let container;

  beforeEach(() => {
    useGameStore.getState().reset();
    useGameStore.getState().setRoomInfo({
      id: 'room-1',
      status: ROOM_STATUS.VOTING,
      mediator_id: 'user-1',
      updated_at: '2026-11-10T00:00:00.000Z',
    });
    useGameStore.getState().setUserId('user-1');
    useGameStore.getState().setVotes([{ id: 'v1', user_id: 'user-1', vote_value: '5' }]);

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(createElement(Harness)));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  it('applies the updated room locally even when no Realtime event arrives', async () => {
    const revealed = {
      id: 'room-1',
      status: ROOM_STATUS.REVEALED,
      mediator_id: 'user-1',
      updated_at: '2026-11-10T00:00:01.000Z',
    };
    const { update, eqMediator } = mockRoomUpdateResult({ data: revealed, error: null });

    await act(async () => {
      await actions.revealVotes();
    });

    const state = useGameStore.getState();
    expect(update).toHaveBeenCalledWith({ status: ROOM_STATUS.REVEALED });
    expect(eqMediator).toHaveBeenCalledWith('mediator_id', 'user-1');
    expect(state.roomInfo.status).toBe(ROOM_STATUS.REVEALED);
    expect(state.error).toBeNull();
  });

  it('surfaces an error when the update matches no rows (e.g. no longer mediator)', async () => {
    mockRoomUpdateResult({
      data: null,
      error: { code: 'PGRST116', message: 'no rows returned' },
    });

    await act(async () => {
      await actions.revealVotes();
    });

    const state = useGameStore.getState();
    expect(state.roomInfo.status).toBe(ROOM_STATUS.VOTING);
    expect(state.error).toMatch(/mediator/i);
  });
});
