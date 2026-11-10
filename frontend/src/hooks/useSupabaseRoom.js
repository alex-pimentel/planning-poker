import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../store/gameStore';
import { ROOM_STATUS } from '../lib/constants';

const ROOM_POLL_INTERVAL_MS = 5000;
const VOTES_FETCH_DEBOUNCE_MS = 150;

export function useSupabaseRoom(roomId, userId, userName) {
  const setRoomInfo = useGameStore((s) => s.setRoomInfo);
  const setVotes = useGameStore((s) => s.setVotes);
  const setParticipants = useGameStore((s) => s.setParticipants);
  const setLocalVote = useGameStore((s) => s.setLocalVote);
  const setIsMediator = useGameStore((s) => s.setIsMediator);
  const clearTable = useGameStore((s) => s.clearTable);
  const setError = useGameStore((s) => s.setError);

  const votesRequestId = useRef(0);
  const votesFetchTimer = useRef(null);

  const fetchLatestVotes = useCallback(
    async (rId) => {
      const requestId = ++votesRequestId.current;
      const { data, error } = await supabase.from('votes').select('*').eq('room_id', rId);
      // Ignore out-of-order responses so an older snapshot cannot wipe newer votes.
      if (!error && data && requestId === votesRequestId.current) {
        setVotes(data);
      }
    },
    [setVotes],
  );

  const scheduleVotesFetch = useCallback(
    (rId) => {
      if (votesFetchTimer.current) clearTimeout(votesFetchTimer.current);
      votesFetchTimer.current = setTimeout(() => {
        votesFetchTimer.current = null;
        fetchLatestVotes(rId);
      }, VOTES_FETCH_DEBOUNCE_MS);
    },
    [fetchLatestVotes],
  );

  const applyRoomState = useCallback(
    (room) => {
      if (!room) return false;

      // Never let a delayed response/event roll the room back to an older state.
      const current = useGameStore.getState().roomInfo;
      if (
        current?.updated_at &&
        room.updated_at &&
        new Date(room.updated_at) < new Date(current.updated_at)
      ) {
        return false;
      }

      const previousStatus = current?.status;
      setRoomInfo(room);

      if (room.mediator_id) {
        setIsMediator(room.mediator_id === userId);
      }
      if (room.status === ROOM_STATUS.RESET) {
        clearTable();
      }
      // Only reset the local card when a new round actually starts; polling the
      // same "voting" state must not clear the card the user just selected.
      if (room.status === ROOM_STATUS.VOTING && previousStatus !== ROOM_STATUS.VOTING) {
        setLocalVote(null);
      }

      return true;
    },
    [setRoomInfo, setIsMediator, userId, clearTable, setLocalVote],
  );

  const fetchRoom = useCallback(
    async (rId) => {
      const { data, error } = await supabase.from('rooms').select('*').eq('id', rId).maybeSingle();

      if (error || !data) return;

      applyRoomState(data);
      // Keep votes in sync too (covers missed vote events, e.g. right before reveal).
      fetchLatestVotes(rId);
    },
    [applyRoomState, fetchLatestVotes],
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
          if (!payload.new) return;
          applyRoomState(payload.new);
          // Re-fetch votes on every room transition so reveal never renders a
          // stale/partial set of cards.
          scheduleVotesFetch(roomId);
        },
      )
      .subscribe((status) => {
        // Also resync after a reconnect where changes may have been missed.
        if (status === 'SUBSCRIBED') fetchRoom(roomId);
      });

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
        () => scheduleVotesFetch(roomId),
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') fetchLatestVotes(roomId);
      });

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
          fetchRoom(roomId);
        }
      });

    fetchRoom(roomId);

    // Reconciliation fallback: Realtime (Postgres Changes) is best-effort and
    // can drop events under load. Polling the room row keeps every client
    // eventually consistent even when an event is lost.
    const resync = () => {
      if (document.visibilityState === 'visible') fetchRoom(roomId);
    };
    const pollId = setInterval(resync, ROOM_POLL_INTERVAL_MS);
    window.addEventListener('focus', resync);
    document.addEventListener('visibilitychange', resync);

    return () => {
      clearInterval(pollId);
      window.removeEventListener('focus', resync);
      document.removeEventListener('visibilitychange', resync);
      if (votesFetchTimer.current) {
        clearTimeout(votesFetchTimer.current);
        votesFetchTimer.current = null;
      }
      supabase.removeChannel(roomChannel);
      supabase.removeChannel(dbRoomSub);
      supabase.removeChannel(dbVoteSub);
    };
  }, [
    roomId,
    userId,
    userName,
    applyRoomState,
    fetchRoom,
    fetchLatestVotes,
    scheduleVotesFetch,
    setParticipants,
  ]);

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
      const { error } = await supabase.from('votes').upsert(
        {
          room_id: roomId,
          user_id: userId,
          user_name: userName,
          vote_value: value,
        },
        { onConflict: 'room_id, user_id' },
      );
      if (error) {
        setError(error.message);
        setLocalVote(null);
      } else {
        // Update immediately for the voter instead of waiting for the event.
        fetchLatestVotes(roomId);
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
