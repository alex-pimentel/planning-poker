import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../store/gameStore';
import { ROOM_STATUS } from '../lib/constants';

export function useSupabaseRoom(roomId, userId, userName) {
  const setRoomInfo = useGameStore((s) => s.setRoomInfo);
  const setVotes = useGameStore((s) => s.setVotes);
  const setParticipants = useGameStore((s) => s.setParticipants);
  const setLocalVote = useGameStore((s) => s.setLocalVote);
  const clearTable = useGameStore((s) => s.clearTable);
  const setError = useGameStore((s) => s.setError);

  const fetchLatestVotes = useCallback(
    async (rId) => {
      const { data, error } = await supabase.from('votes').select('*').eq('room_id', rId);
      if (!error && data) {
        setVotes(data);
      }
    },
    [setVotes],
  );

  useEffect(() => {
    if (!roomId || !userId || !userName) return;

    const roomChannel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: userId } },
    });

    const dbRoomSub = supabase
      .channel(`room-db:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          setRoomInfo(payload.new);
          if (payload.new.status === ROOM_STATUS.RESET) {
            clearTable();
          }
        },
      )
      .subscribe();

    const dbVoteSub = supabase
      .channel(`votes-db:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          fetchLatestVotes(roomId);
        },
      )
      .subscribe();

    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const state = roomChannel.presenceState();
        const participants = {};
        for (const presences of Object.values(state)) {
          const p = presences[0];
          if (p?.user_id) {
            participants[p.user_id] = p;
          }
        }
        setParticipants(participants);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await roomChannel.track({
            user_name: userName,
            user_id: userId,
            online_at: new Date().toISOString(),
          });
        }
      });

    fetchLatestVotes(roomId);

    return () => {
      supabase.removeChannel(roomChannel);
      supabase.removeChannel(dbRoomSub);
      supabase.removeChannel(dbVoteSub);
    };
  }, [roomId, userId, userName, setRoomInfo, setParticipants, clearTable, fetchLatestVotes]);

  const castVote = useCallback(
    async (value) => {
      if (!roomId || !userId) return;

      const currentVote = useGameStore.getState().localVote;

      // Clicking the same card again removes the vote
      if (value === currentVote) {
        setLocalVote(null);
        const { error } = await supabase
          .from('votes')
          .delete()
          .eq('room_id', roomId)
          .eq('user_id', userId);
        if (error) setError(error.message);
        else fetchLatestVotes(roomId);
        return;
      }

      setLocalVote(value);
      const { error } = await supabase
        .from('votes')
        .upsert(
          { room_id: roomId, user_id: userId, user_name: userName, vote_value: value },
          { onConflict: 'room_id, user_id' },
        );
      if (error) {
        setError(error.message);
        setLocalVote(null);
      }
    },
    [roomId, userId, userName, setLocalVote, setError, fetchLatestVotes],
  );

  const leaveRoom = useCallback(async () => {
    if (!roomId || !userId) return;
    await supabase.from('votes').delete().eq('room_id', roomId).eq('user_id', userId);
  }, [roomId, userId]);

  return { castVote, fetchLatestVotes, leaveRoom };
}
