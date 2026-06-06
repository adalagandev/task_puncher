import { useCallback, useEffect, useState } from "react";
import { api, ApiError, NetworkError } from "../api/client";
import type { MilestoneInput, Task, TaskInput } from "../types";

export interface UseTasks {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  unreachable: boolean;
  clearError: () => void;
  refresh: () => Promise<void>;
  createTask: (data: TaskInput) => Promise<boolean>;
  updateTask: (id: number, data: Partial<TaskInput & { status: string }>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  completeTask: (id: number) => Promise<void>;
  reopenTask: (id: number) => Promise<void>;
  addMilestone: (taskId: number, data: MilestoneInput) => Promise<void>;
  toggleMilestone: (taskId: number, milestoneId: number, done: boolean) => Promise<void>;
  deleteMilestone: (taskId: number, milestoneId: number) => Promise<void>;
  setWeekly: (taskId: number, selected: boolean) => Promise<void>;
}

export function useTasks(): UseTasks {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Server-unreachable is its own state (not an error string) so the UI can swap
  // in a "is the backend running? [Retry]" panel instead of the red banner (TP-006).
  const [unreachable, setUnreachable] = useState(false);

  const run = useCallback(async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      setUnreachable(false); // a successful call proves the server is back
    } catch (e) {
      if (e instanceof NetworkError) setUnreachable(true);
      else setError(e instanceof ApiError ? e.message : "Something went wrong");
      throw e;
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true); // also covers Retry, so the panel shows progress
    try {
      setTasks(await api.listTasks());
      setUnreachable(false);
      setError(null);
    } catch (e) {
      if (e instanceof NetworkError) setUnreachable(true);
      else setError(e instanceof ApiError ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    tasks,
    loading,
    error,
    unreachable,
    clearError: () => setError(null),
    refresh,
    createTask: async (data) => {
      try {
        await api.createTask(data);
        await refresh();
        return true;
      } catch (e) {
        if (e instanceof NetworkError) setUnreachable(true);
        else setError(e instanceof ApiError ? e.message : "Failed to create task");
        return false;
      }
    },
    updateTask: (id, data) => run(() => api.updateTask(id, data)).then(refresh),
    deleteTask: (id) => run(() => api.deleteTask(id)).then(refresh),
    completeTask: (id) => run(() => api.completeTask(id)).then(refresh),
    reopenTask: (id) => run(() => api.reopenTask(id)).then(refresh),
    addMilestone: (taskId, data) => run(() => api.addMilestone(taskId, data)).then(refresh),
    toggleMilestone: (taskId, milestoneId, done) =>
      run(() => api.updateMilestone(taskId, milestoneId, { done })).then(refresh),
    deleteMilestone: (taskId, milestoneId) =>
      run(() => api.deleteMilestone(taskId, milestoneId)).then(refresh),
    setWeekly: (taskId, selected) =>
      run(() => api.setWeeklySelection(taskId, selected)).then(refresh),
  };
}
