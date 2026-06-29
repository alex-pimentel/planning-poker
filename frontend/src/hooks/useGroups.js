import { useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useGameStore } from "../store/gameStore";

export function useGroups(roomId) {
  const setGroups = useGameStore((s) => s.setGroups);
  const setParticipantGroupMap = useGameStore((s) => s.setParticipantGroupMap);
  const groups = useGameStore((s) => s.groups);
  const participantGroupMap = useGameStore((s) => s.participantGroupMap);

  const fetchGroups = useCallback(async () => {
    if (!roomId) return;
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });
    if (!error && data) setGroups(data);
  }, [roomId, setGroups]);

  const fetchParticipantGroups = useCallback(async () => {
    if (!roomId) return;
    const { data, error } = await supabase
      .from("participant_groups")
      .select("*")
      .eq("room_id", roomId);
    if (!error && data) {
      const map = {};
      for (const pg of data) {
        map[pg.user_id] = pg.group_id;
      }
      setParticipantGroupMap(map);
    }
  }, [roomId, setParticipantGroupMap]);

  const addGroup = useCallback(
    async (name) => {
      const setError = useGameStore.getState().setError;
      if (!roomId || !name.trim()) return null;
      const { data, error } = await supabase
        .from("groups")
        .insert({ room_id: roomId, name: name.trim() })
        .select()
        .single();
      if (error) {
        setError(error.message);
        return null;
      }
      if (data) {
        await fetchGroups();
        return data;
      }
      return null;
    },
    [roomId, fetchGroups],
  );

  const renameGroup = useCallback(
    async (groupId, name) => {
      const setError = useGameStore.getState().setError;
      if (!name.trim()) return;
      const { error } = await supabase
        .from("groups")
        .update({ name: name.trim() })
        .eq("id", groupId);
      if (error) {
        setError(error.message);
        return;
      }
      await fetchGroups();
    },
    [fetchGroups],
  );

  const deleteGroup = useCallback(
    async (groupId) => {
      const setError = useGameStore.getState().setError;
      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", groupId);
      if (error) {
        setError(error.message);
        return;
      }
      await fetchGroups();
      await fetchParticipantGroups();
    },
    [fetchGroups, fetchParticipantGroups],
  );

  const assignParticipant = useCallback(
    async (userId, groupId) => {
      const setError = useGameStore.getState().setError;
      if (!roomId) return;
      const { error } = await supabase
        .from("participant_groups")
        .upsert(
          { room_id: roomId, user_id: userId, group_id: groupId },
          { onConflict: "room_id, user_id" },
        );
      if (error) {
        setError(error.message);
        return;
      }
      await fetchParticipantGroups();
    },
    [roomId, fetchParticipantGroups],
  );

  const removeParticipant = useCallback(
    async (userId) => {
      const setError = useGameStore.getState().setError;
      if (!roomId) return;
      const { error } = await supabase
        .from("participant_groups")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", userId);
      if (error) {
        setError(error.message);
        return;
      }
      await fetchParticipantGroups();
    },
    [roomId, fetchParticipantGroups],
  );

  const joinGroup = useCallback(
    async (groupId) => {
      const userId = useGameStore.getState().userId;
      const setError = useGameStore.getState().setError;
      if (!roomId || !userId) return;
      const { data: existing, error: selErr } = await supabase
        .from("participant_groups")
        .select("id")
        .eq("room_id", roomId)
        .eq("user_id", userId)
        .maybeSingle();
      if (selErr) {
        setError(selErr.message);
        return;
      }
      let opError;
      if (existing?.id) {
        const { error } = await supabase
          .from("participant_groups")
          .update({ group_id: groupId })
          .eq("room_id", roomId)
          .eq("user_id", userId);
        opError = error;
      } else {
        const { error } = await supabase.from("participant_groups").insert({
          room_id: roomId,
          user_id: userId,
          group_id: groupId,
        });
        opError = error;
      }
      if (opError) {
        setError(opError.message);
        return;
      }
      await fetchParticipantGroups();
    },
    [roomId, fetchParticipantGroups],
  );

  useEffect(() => {
    if (!roomId) return;
    fetchGroups();
    fetchParticipantGroups();
    const groupsChannel = supabase
      .channel(`groups-db:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "groups",
          filter: `room_id=eq.${roomId}`,
        },
        () => fetchGroups(),
      )
      .subscribe();
    const pgChannel = supabase
      .channel(`participant_groups-db:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participant_groups",
          filter: `room_id=eq.${roomId}`,
        },
        () => fetchParticipantGroups(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(groupsChannel);
      supabase.removeChannel(pgChannel);
    };
  }, [roomId, fetchGroups, fetchParticipantGroups]);

  return {
    groups,
    participantGroupMap,
    fetchGroups,
    fetchParticipantGroups,
    addGroup,
    renameGroup,
    deleteGroup,
    assignParticipant,
    removeParticipant,
    joinGroup,
  };
}
