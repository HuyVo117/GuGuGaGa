import { useCallback } from "react";
import { logoutAdmin } from "../authService";

export function useSignOut() {
  return useCallback(async () => {
    await logoutAdmin();
    window.location.href = "/login";
  }, []);
}
