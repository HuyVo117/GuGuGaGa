import { useQuery } from "@tanstack/react-query";
import { getAuthUser } from "../authService";

export function useAuthUser() {
  const hasToken = Boolean(localStorage.getItem("admin_token"));

  return useQuery({
    queryKey: ["auth-user"],
    queryFn: getAuthUser,
    enabled: hasToken,
    staleTime: 30 * 1000,
    retry: false,
  });
}
