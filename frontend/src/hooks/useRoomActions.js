import { useCallback } from 'react';
import { supabase, ensureAnonAuth } from '../lib/supabase';
import { useGameStore } from '../store/gameStore';
import { generateRoomCode } from '../lib/utils';
import { ROOM_STATUS } from '../lib/constants';

export function useRoomActions() {
  const { setRoomInfo, setUserId, setIsMediator, setError, clearTable } = useGameStore();

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
    try {
      const roomId = useGameStore.getState().roomInfo.id;
      const { error } = await supabase
        .from('rooms')
        .update({ status: ROOM_STATUS.REVEALED })
        .eq('id', roomId)
        .eq('mediator_id', useGameStore.getState().userId);

      if (error) throw error;
    } catch (err) {
      setError(err.message);
    }
  }, [setError]);

  const resetRound = useCallback(
    async (newTaskName) => {
      try {
        const roomId = useGameStore.getState().roomInfo.id;

        await supabase.from('votes').delete().eq('room_id', roomId);

        const updates = { status: ROOM_STATUS.VOTING };
        if (newTaskName) updates.current_task = newTaskName;

        const { error } = await supabase
          .from('rooms')
          .update(updates)
          .eq('id', roomId)
          .eq('mediator_id', useGameStore.getState().userId);

        if (error) throw error;

        clearTable();

        const channel = supabase.channel(`room:${roomId}`);
        await channel.send({
          type: 'broadcast',
          event: 'round_reset',
          payload: {},
        });
        supabase.removeChannel(channel);
      } catch (err) {
        setError(err.message);
      }
    },
    [setError, clearTable],
  );

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

  return { createRoom, joinRoom, revealVotes, resetRound, kickParticipant };
}
