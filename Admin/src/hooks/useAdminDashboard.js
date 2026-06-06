import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignDriverToOrder,
  createAdminProduct,
  deleteAdminProduct,
  getAdminBranches,
  getAdminCategories,
  getAdminDrivers,
  getAdminOrders,
  getAdminProducts,
  getAdminUsers,
  updateOrderStatus,
} from "../authService";

export function useAdminDashboard() {
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ["admin-categories"],
    queryFn: getAdminCategories,
  });

  const productsQuery = useQuery({
    queryKey: ["admin-products"],
    queryFn: getAdminProducts,
  });

  const ordersQuery = useQuery({
    queryKey: ["admin-orders"],
    queryFn: getAdminOrders,
  });

  const driversQuery = useQuery({
    queryKey: ["admin-drivers"],
    queryFn: getAdminDrivers,
  });

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAdminUsers,
  });

  const branchesQuery = useQuery({
    queryKey: ["admin-branches"],
    queryFn: getAdminBranches,
  });

  const createProductMutation = useMutation({
    mutationFn: createAdminProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteAdminProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const updateOrderStatusMutation = useMutation({
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
    categories: categoriesQuery.data || [],
    products: productsQuery.data || [],
    orders: ordersQuery.data || [],
    drivers: driversQuery.data || [],
    users: usersQuery.data || [],
    branches: branchesQuery.data || [],
    loading: {
      categories: categoriesQuery.isLoading,
      products: productsQuery.isLoading,
      orders: ordersQuery.isLoading,
      users: usersQuery.isLoading,
      branches: branchesQuery.isLoading,
    },
    createProductMutation,
    deleteProductMutation,
    updateOrderStatusMutation,
    assignDriverMutation,
  };
}
