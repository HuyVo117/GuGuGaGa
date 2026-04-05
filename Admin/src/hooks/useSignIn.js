import { useMutation } from "@tanstack/react-query";
import { loginAdmin } from "../authService";

export function useSignIn() {
  return useMutation({
    mutationFn: ({ email, password }) => loginAdmin(email, password),
  });
}
