import { useQuery } from "@tanstack/react-query";
import { authService } from "../services/authService.js";

const useAuthUser = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["authUser"],
    queryFn: authService.getAuthUser,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    authUser: data,
    isLoading,
    error,
  };
};

export default useAuthUser;
