import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useTags() {
  return useQuery({
    queryKey: [api.tags.list.path],
    queryFn: async () => {
      const res = await fetch(api.tags.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tags");
      return api.tags.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await fetch(api.tags.create.path, {
        method: api.tags.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create tag");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tags.list.path] });
    },
  });
}
