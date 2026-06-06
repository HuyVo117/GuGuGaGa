import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/authService.js";

const useSignIn = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (loginData) => authService.signIn(loginData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
  });

  return {
    loginMutation: mutation.mutate,
    isPending: mutation.isLoading,
    error: mutation.error,
  };
};

export default useSignIn;
