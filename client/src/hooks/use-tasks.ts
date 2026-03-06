import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type TaskInput, type TaskUpdateInput } from "@shared/routes";

function parseWithLogging<T>(schema: any, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useTasks(filters?: { listId?: number; date?: string }) {
  const queryParams = new URLSearchParams();
  if (filters?.listId) queryParams.append("listId", filters.listId.toString());
  if (filters?.date) queryParams.append("date", filters.date);
  
  const url = `${api.tasks.list.path}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  return useQuery({
    queryKey: [api.tasks.list.path, filters],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      return parseWithLogging<any>(api.tasks.list.responses[200], data, "tasks.list");
    },
  });
}

export function useTask(id: number | null) {
  return useQuery({
    queryKey: [api.tasks.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.tasks.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch task");
      const data = await res.json();
      return parseWithLogging<any>(api.tasks.get.responses[200], data, "tasks.get");
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TaskInput) => {
      const res = await fetch(api.tasks.create.path, {
        method: api.tasks.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create task");
      const json = await res.json();
      return parseWithLogging<any>(api.tasks.create.responses[201], json, "tasks.create");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.lists.list.path] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & TaskUpdateInput) => {
      const url = buildUrl(api.tasks.update.path, { id });
      const res = await fetch(url, {
        method: api.tasks.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update task");
      const json = await res.json();
      return parseWithLogging<any>(api.tasks.update.responses[200], json, "tasks.update");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.get.path, variables.id] });
      queryClient.invalidateQueries({ queryKey: [api.lists.list.path] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.tasks.delete.path, { id });
      const res = await fetch(url, {
        method: api.tasks.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete task");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.lists.list.path] });
    },
  });
}

export function useCreateSubtask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, title }: { taskId: number; title: string }) => {
      const url = buildUrl(api.subtasks.create.path, { taskId });
      const res = await fetch(url, {
        method: api.subtasks.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create subtask");
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.get.path, variables.taskId] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
    },
  });
}

export function useUpdateSubtask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, taskId, ...updates }: { id: number, taskId: number, completed?: boolean, title?: string }) => {
      const url = buildUrl(api.subtasks.update.path, { id });
      const res = await fetch(url, {
        method: api.subtasks.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update subtask");
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.get.path, variables.taskId] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
    },
  });
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, taskId }: { id: number, taskId: number }) => {
      const url = buildUrl(api.subtasks.delete.path, { id });
      const res = await fetch(url, {
        method: api.subtasks.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete subtask");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.get.path, variables.taskId] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
    },
  });
}

export function useAssignTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, tagId }: { taskId: number; tagId: number }) => {
      const url = buildUrl(api.tasks.assignTag.path, { id: taskId });
      const res = await fetch(url, {
        method: api.tasks.assignTag.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to assign tag");
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.get.path, variables.taskId] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
    },
  });
}

export function useRemoveTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, tagId }: { taskId: number; tagId: number }) => {
      const url = buildUrl(api.tasks.removeTag.path, { id: taskId, tagId });
      const res = await fetch(url, {
        method: api.tasks.removeTag.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove tag");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.get.path, variables.taskId] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
    },
  });
}
