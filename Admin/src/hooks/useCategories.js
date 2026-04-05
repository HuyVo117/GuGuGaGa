import { useQuery } from "@tanstack/react-query";
import { getAdminCategories } from "../authService";

export function useCategories() {
  return useQuery({
    queryKey: ["admin-categories"],
    queryFn: getAdminCategories,
  });
}
