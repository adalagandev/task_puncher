import type { Milestone, MilestoneInput, Task, TaskInput } from "../types";

const BASE = "/api";

class ApiError extends Error {}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.detail) {
        detail = Array.isArray(body.detail)
          ? body.detail.map((d: { msg: string }) => d.msg).join("; ")
          : body.detail;
      }
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  listTasks: () => request<Task[]>("/tasks"),
  createTask: (data: TaskInput) =>
    request<Task>("/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id: number, data: Partial<TaskInput & { status: string }>) =>
    request<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTask: (id: number) => request<void>(`/tasks/${id}`, { method: "DELETE" }),
  completeTask: (id: number) => request<Task>(`/tasks/${id}/complete`, { method: "POST" }),
  reopenTask: (id: number) => request<Task>(`/tasks/${id}/reopen`, { method: "POST" }),

  addMilestone: (taskId: number, data: MilestoneInput) =>
    request<Milestone>(`/tasks/${taskId}/milestones`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateMilestone: (
    taskId: number,
    milestoneId: number,
    data: Partial<{ title: string; relevance: string; order: number; done: boolean }>
  ) =>
    request<Milestone>(`/tasks/${taskId}/milestones/${milestoneId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteMilestone: (taskId: number, milestoneId: number) =>
    request<void>(`/tasks/${taskId}/milestones/${milestoneId}`, { method: "DELETE" }),

  setWeeklySelection: (taskId: number, selected: boolean) =>
    request<Task>(`/weekly/${taskId}`, {
      method: "PUT",
      body: JSON.stringify({ selected }),
    }),
};

export { ApiError };
