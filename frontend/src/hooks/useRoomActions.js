import { useCallback } from 'react';
import { supabase, ensureAnonAuth } from '../lib/supabase';
import { useGameStore } from '../store/gameStore';
import { generateRoomCode } from '../lib/utils';
import { ROOM_STATUS } from '../lib/constants';

const NOT_MEDIATOR_MESSAGE =
  'Could not update the room because you are no longer the mediator. Try rejoining the room.';

function isMissingRowError(error) {
  return error?.code === 'PGRST116';
}

export function useRoomActions() {
  const { setRoomInfo, setUserId, setIsMediator, setError } = useGameStore();

  const createRoom = useCallback(
    async (_userName, deckType = 'fibonacci') => {
      try {
        const user = await ensureAnonAuth();
        if (!user) throw new Error('Failed to authenticate');

        const roomCode = generateRoomCode();

        const { data, error } = await supabase
          .from('rooms')
          .insert({
            room_code: roomCode,
            mediator_id: user.id,
            deck_type: deckType,
          })
          .select()
          .single();

        if (error) throw error;

        const { error: taskError } = await supabase.from('tasks').insert({
          room_id: data.id,
          name: data.current_task,
          sort_order: 0,
        });
        if (taskError) throw taskError;

        setUserId(user.id);
        setIsMediator(true);
        setRoomInfo(data);

        return { room: data, userId: user.id };
      } catch (err) {
        setError(err.message);
        return null;
      }
    },
    [setRoomInfo, setUserId, setIsMediator, setError],
  );

  const joinRoom = useCallback(
    async (roomCode) => {
      try {
        const user = await ensureAnonAuth();
        if (!user) throw new Error('Failed to authenticate');

        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('room_code', roomCode.toUpperCase())
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw new Error('Room not found. Check the code and try again.');
          }
          throw error;
        }

        setUserId(user.id);
        setIsMediator(false);
        setRoomInfo(data);

        return { room: data, userId: user.id };
      } catch (err) {
        setError(err.message);
        return null;
      }
    },
    [setRoomInfo, setUserId, setIsMediator, setError],
  );

  const revealVotes = useCallback(async () => {
    const store = useGameStore.getState();

    try {
      const { data, error } = await supabase
        .from('rooms')
        .update({ status: ROOM_STATUS.REVEALED })
        .eq('id', store.roomInfo.id)
        .eq('mediator_id', store.userId)
        .select()
        .single();

      if (error) {
        if (isMissingRowError(error)) throw new Error(NOT_MEDIATOR_MESSAGE);
        throw error;
      }
      if (!data) throw new Error('Could not reveal the cards. Please try again.');

      // Apply the confirmed row immediately. The UI must not depend solely on
      // the Postgres Changes event, which is best-effort and can be dropped.
      store.setRoomInfo(data);
      store.setError(null);
    } catch (err) {
      store.setError(err.message);
    }
  }, []);

  const resetRound = useCallback(async (newTaskName) => {
    const store = useGameStore.getState();

    try {
      const { error: votesError } = await supabase
        .from('votes')
        .delete()
        .eq('room_id', store.roomInfo.id);
      if (votesError) throw votesError;

      const updates = { status: ROOM_STATUS.VOTING };
      if (newTaskName) updates.current_task = newTaskName;

      const { data, error } = await supabase
        .from('rooms')
        .update(updates)
        .eq('id', store.roomInfo.id)
        .eq('mediator_id', store.userId)
        .select()
        .single();

      if (error) {
        if (isMissingRowError(error)) throw new Error(NOT_MEDIATOR_MESSAGE);
        throw error;
      }
      if (!data) throw new Error('Could not start a new round. Please try again.');

      store.setRoomInfo(data);
      store.clearTable();
      store.setError(null);
    } catch (err) {
      store.setError(err.message);
    }
  }, []);

  const advanceRound = useCallback(async (nextTaskName) => {
    const store = useGameStore.getState();

    try {
      const { error: votesError } = await supabase
        .from('votes')
        .delete()
        .eq('room_id', store.roomInfo.id);
      if (votesError) throw votesError;

      const updates = { status: ROOM_STATUS.VOTING };
      if (nextTaskName) updates.current_task = nextTaskName;

      const { data, error } = await supabase
        .from('rooms')
        .update(updates)
        .eq('id', store.roomInfo.id)
        .eq('mediator_id', store.userId)
        .select()
        .single();

      if (error) {
        if (isMissingRowError(error)) throw new Error(NOT_MEDIATOR_MESSAGE);
        throw error;
      }
      if (!data) throw new Error('Could not start the next round. Please try again.');

      store.setRoomInfo(data);
      store.clearTable();
      store.setError(null);
    } catch (err) {
      store.setError(err.message);
    }
  }, []);

  const transferMediator = useCallback(async (targetUserId) => {
    const store = useGameStore.getState();

    const { data, error } = await supabase
      .from('rooms')
      .update({ mediator_id: targetUserId })
      .eq('id', store.roomInfo.id)
      .eq('mediator_id', store.userId)
      .select()
      .single();

    if (error) {
      store.setError(isMissingRowError(error) ? NOT_MEDIATOR_MESSAGE : error.message);
      return;
    }
    if (!data) {
      store.setError(NOT_MEDIATOR_MESSAGE);
      return;
    }

    store.setRoomInfo(data);
    store.setIsMediator(false);
    store.setError(null);
  }, []);

  const kickParticipant = useCallback(async (targetUserId) => {
    const store = useGameStore.getState();
    const roomId = store.roomInfo.id;

    const { error } = await supabase
      .from('votes')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', targetUserId);
    if (error) {
      store.setError(error.message);
      return;
    }

    // Refresh votes immediately so VoteResults updates in real time
    const { data } = await supabase.from('votes').select('*').eq('room_id', roomId);
    if (data) store.setVotes(data);
  }, []);

  return {
    createRoom,
    joinRoom,
    revealVotes,
    resetRound,
    advanceRound,
    transferMediator,
    kickParticipant,
  };
}
