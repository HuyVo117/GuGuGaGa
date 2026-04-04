import { useQuery } from "@tanstack/react-query";
import { getAuthUser } from "../authService";

export function useAuthUser() {
  return useQuery({
    queryKey: ["auth-user"],
    queryFn: getAuthUser,
    retry: false,
  });
}
