import { useQuery } from "@tanstack/react-query";
import { getAdminUsers } from "../authService";

export function useUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: getAdminUsers,
  });
}
