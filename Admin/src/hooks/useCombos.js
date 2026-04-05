import { useQuery } from "@tanstack/react-query";

export function useCombos() {
  return useQuery({
    queryKey: ["admin-combos"],
    queryFn: async () => [],
  });
}
