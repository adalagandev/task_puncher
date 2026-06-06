import type { Milestone, MilestoneInput, Task, TaskInput } from "../types";

const BASE = "/api";

class ApiError extends Error {}

// Distinct from ApiError (which the backend returned): the server couldn't be
// reached at all, so the UI shows a "is the backend running?" state (TP-006).
class NetworkError extends Error {}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    // fetch rejects on a dead connection / DNS / network failure — the API is down.
    throw new NetworkError("Can't reach the server.");
  }
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    let parsed = false;
    try {
      const body = await res.json();
      if (body?.detail) {
        detail = Array.isArray(body.detail)
          ? body.detail.map((d: { msg: string }) => d.msg).join("; ")
          : body.detail;
      }
      parsed = true;
    } catch {
      /* non-JSON error body */
    }
    // The Vite dev proxy answers a dead backend with a non-JSON 5xx page; treat
    // that as unreachable rather than flashing a raw "500" at the user.
    if (!parsed && res.status >= 500) {
      throw new NetworkError("Can't reach the server.");
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

export { ApiError, NetworkError };
