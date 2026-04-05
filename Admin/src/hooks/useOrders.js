import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignDriverToOrder, getAdminOrders, updateOrderStatus } from "../authService";

export function useOrders() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-orders"],
    queryFn: getAdminOrders,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, payload }) => updateOrderStatus(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-drivers"] });
    },
  });

  const assignDriverMutation = useMutation({
    mutationFn: ({ id, driverId }) => assignDriverToOrder(id, driverId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-drivers"] });
    },
  });

  return {
    ...query,
    updateStatusMutation,
    assignDriverMutation,
  };
}
