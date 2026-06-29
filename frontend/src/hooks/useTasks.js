import { useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../store/gameStore';

export function useTasks(roomId) {
  const tasks = useGameStore((s) => s.tasks);
  const setTasks = useGameStore((s) => s.setTasks);
  const setRoomInfo = useGameStore((s) => s.setRoomInfo);

  const fetchTasks = useCallback(async () => {
    if (!roomId) return;
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('room_id', roomId)
      .order('sort_order', { ascending: true });
    if (!error && data) {
      setTasks(data);
    }
  }, [roomId, setTasks]);

  const notifyTasksChanged = useCallback(async () => {
    const channel = supabase.channel(`room:${roomId}`);
    await channel.send({ type: 'broadcast', event: 'tasks_changed', payload: {} });
    supabase.removeChannel(channel);
  }, [roomId]);

  const addTask = useCallback(
    async (name, groupId) => {
      if (!roomId || !name.trim()) return null;
      const { data: existing } = await supabase
        .from('tasks')
        .select('sort_order')
        .eq('room_id', roomId)
        .order('sort_order', { ascending: false })
        .limit(1);
      const nextSort = existing?.length ? existing[0].sort_order + 1 : 0;
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          room_id: roomId,
          name: name.trim(),
          group_id: groupId || null,
          sort_order: nextSort,
        })
        .select()
        .single();
      if (!error && data) {
        await fetchTasks();
        await notifyTasksChanged();
        return data;
      }
      return null;
    },
    [roomId, fetchTasks, notifyTasksChanged],
  );

  const updateTask = useCallback(
    async (taskId, updates) => {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);
      if (!error) {
        await fetchTasks();
        await notifyTasksChanged();
      }
    },
    [fetchTasks, notifyTasksChanged],
  );

  const deleteTask = useCallback(
    async (taskId) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      if (!error) {
        await fetchTasks();
        await notifyTasksChanged();
      }
    },
    [fetchTasks, notifyTasksChanged],
  );

  const reorderTasks = useCallback(
    async (orderedIds) => {
      const { roomInfo, tasks } = useGameStore.getState();
      const updates = orderedIds.map((id, i) => {
        const existing = tasks.find((t) => t.id === id);
        return {
          id,
          room_id: roomInfo.id,
          name: existing?.name || 'Task',
          sort_order: i,
        };
      });
      const { error } = await supabase.from('tasks').upsert(updates);
      if (!error) {
        await fetchTasks();
        await notifyTasksChanged();
      }
    },
    [fetchTasks, notifyTasksChanged],
  );

  const advanceToNextTask = useCallback(
    async (currentTaskId) => {
      const { tasks } = useGameStore.getState();
      const currentIdx = tasks.findIndex((t) => t.id === currentTaskId);
      const nextTask = tasks[currentIdx + 1];
      if (nextTask) {
        await supabase
          .from('rooms')
          .update({ current_task: nextTask.name })
          .eq('id', roomId)
          .eq('mediator_id', useGameStore.getState().userId);
        setRoomInfo({ current_task: nextTask.name });
        return nextTask;
      }
      return null;
    },
    [roomId, setRoomInfo],
  );

  useEffect(() => {
    if (!roomId) return;
    fetchTasks();
    const channel = supabase.channel(`room:${roomId}`);
    channel
      .on('broadcast', { event: 'tasks_changed' }, () => fetchTasks())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchTasks]);

  return { tasks, fetchTasks, addTask, updateTask, deleteTask, reorderTasks, advanceToNextTask };
}
