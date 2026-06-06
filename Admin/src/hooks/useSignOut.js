import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/authService.js";

const useSignOut = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => authService.signOut(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
  });

  return {
    signOutMutation: mutation.mutate,
    isPending: mutation.isLoading,
    error: mutation.error,
  };
};

export default useSignOut;
