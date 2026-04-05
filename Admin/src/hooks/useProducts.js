import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAdminProduct, deleteAdminProduct, getAdminProducts } from "../authService";

export function useProducts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-products"],
    queryFn: getAdminProducts,
  });

  const createMutation = useMutation({
    mutationFn: createAdminProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  return {
    ...query,
    createMutation,
    deleteMutation,
  };
}
