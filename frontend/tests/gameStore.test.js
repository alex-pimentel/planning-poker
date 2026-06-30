import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../src/store/gameStore';
import { ROOM_STATUS } from '../src/lib/constants';

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it('starts with default initial state', () => {
    const state = useGameStore.getState();
    expect(state.roomInfo.id).toBeNull();
    expect(state.roomInfo.status).toBe(ROOM_STATUS.VOTING);
    expect(state.votes).toEqual([]);
    expect(state.localVote).toBeNull();
    expect(state.participants).toEqual({});
    expect(state.tasks).toEqual([]);
    expect(state.groups).toEqual([]);
    expect(state.participantGroupMap).toEqual({});
  });

  it('sets room info', () => {
    const roomData = {
      id: 'abc-123',
      room_code: 'TEST42',
      status: ROOM_STATUS.VOTING,
      current_task: 'My Task',
      mediator_id: 'user-1',
      deck_type: 'fibonacci',
    };
    useGameStore.getState().setRoomInfo(roomData);
    expect(useGameStore.getState().roomInfo).toMatchObject(roomData);
  });

  it('sets user identity', () => {
    useGameStore.getState().setUserId('user-1');
    useGameStore.getState().setUserName('Alex');
    useGameStore.getState().setIsMediator(true);

    expect(useGameStore.getState().userId).toBe('user-1');
    expect(useGameStore.getState().userName).toBe('Alex');
    expect(useGameStore.getState().isMediator).toBe(true);
  });

  it('manages local vote', () => {
    useGameStore.getState().setLocalVote('5');
    expect(useGameStore.getState().localVote).toBe('5');
  });

  it('manages votes array', () => {
    const votes = [{ id: 'v1', vote_value: '8' }, { id: 'v2', vote_value: '5' }];
    useGameStore.getState().setVotes(votes);
    expect(useGameStore.getState().votes).toHaveLength(2);
    expect(useGameStore.getState().votes[0].vote_value).toBe('8');
  });

  it('clears table without resetting room info', () => {
    useGameStore.getState().setRoomInfo({ id: 'abc-123', room_code: 'TEST42' });
    useGameStore.getState().setLocalVote('3');
    useGameStore.getState().setVotes([{ id: 'v1', vote_value: '3' }]);

    useGameStore.getState().clearTable();

    expect(useGameStore.getState().localVote).toBeNull();
    expect(useGameStore.getState().votes).toHaveLength(0);
    expect(useGameStore.getState().roomInfo.id).toBe('abc-123');
  });

  it('returns correct deck for fibonacci', () => {
    useGameStore.getState().setRoomInfo({ deck_type: 'fibonacci' });
    const deck = useGameStore.getState().getDeck();
    expect(deck).toContain('☕');
    expect(deck).toContain('8');
    expect(deck).toContain('34');
    expect(deck).toContain('?');
    expect(deck).not.toContain('XS');
  });

  it('returns correct deck for tshirt', () => {
    useGameStore.getState().setRoomInfo({ deck_type: 'tshirt' });
    const deck = useGameStore.getState().getDeck();
    expect(deck).toContain('XS');
    expect(deck).toContain('XL');
    expect(deck).toContain('?');
    expect(deck).not.toContain('21');
  });

  it('returns correct deck for powers2', () => {
    useGameStore.getState().setRoomInfo({ deck_type: 'powers2' });
    const deck = useGameStore.getState().getDeck();
    expect(deck).toContain('1');
    expect(deck).toContain('16');
    expect(deck).toContain('64');
    expect(deck).toContain('?');
    expect(deck).not.toContain('13');
  });

  it('resets to initial state', () => {
    useGameStore.getState().setRoomInfo({ id: 'abc-123' });
    useGameStore.getState().setUserId('user-1');
    useGameStore.getState().setLocalVote('8');
    useGameStore.getState().setTasks([{ id: 't1', name: 'Task 1' }]);
    useGameStore.getState().setGroups([{ id: 'g1', name: 'Frontend' }]);
    useGameStore.getState().setParticipantGroupMap({ 'user-1': 'g1' });

    useGameStore.getState().reset();

    const state = useGameStore.getState();
    expect(state.roomInfo.id).toBeNull();
    expect(state.userId).toBeNull();
    expect(state.localVote).toBeNull();
    expect(state.tasks).toEqual([]);
    expect(state.groups).toEqual([]);
    expect(state.participantGroupMap).toEqual({});
  });

  it('sets participants', () => {
    const participants = {
      'user-1': { user_name: 'Alex', online_at: '2026-01-01T00:00:00Z' },
      'user-2': { user_name: 'Bob', online_at: '2026-01-01T00:00:01Z' },
    };
    useGameStore.getState().setParticipants(participants);
    expect(Object.keys(useGameStore.getState().participants)).toHaveLength(2);
  });

  it('sets tasks', () => {
    const tasks = [
      { id: 't1', name: 'Task 1', sort_order: 0 },
      { id: 't2', name: 'Task 2', sort_order: 1 },
    ];
    useGameStore.getState().setTasks(tasks);
    expect(useGameStore.getState().tasks).toHaveLength(2);
    expect(useGameStore.getState().tasks[0].name).toBe('Task 1');
  });

  it('sets groups', () => {
    const groups = [
      { id: 'g1', name: 'Frontend' },
      { id: 'g2', name: 'Backend' },
    ];
    useGameStore.getState().setGroups(groups);
    expect(useGameStore.getState().groups).toHaveLength(2);
    expect(useGameStore.getState().groups[1].name).toBe('Backend');
  });

  it('sets participant group map', () => {
    const map = { 'user-1': 'g1', 'user-2': 'g2' };
    useGameStore.getState().setParticipantGroupMap(map);
    expect(useGameStore.getState().participantGroupMap['user-1']).toBe('g1');
    expect(useGameStore.getState().participantGroupMap['user-2']).toBe('g2');
  });

  it('sets and clears error', () => {
    useGameStore.getState().setError('Something went wrong');
    expect(useGameStore.getState().error).toBe('Something went wrong');

    useGameStore.getState().setError(null);
    expect(useGameStore.getState().error).toBeNull();
  });
});
