import { useQuery } from "@tanstack/react-query";
import { getAdminBranches, getAdminDrivers } from "../authService";
import { useCategories } from "./useCategories";
import { useOrders } from "./useOrders";
import { useProducts } from "./useProducts";
import { useUsers } from "./useUsers";

export function useDashboard() {
  const categories = useCategories();
  const products = useProducts();
  const orders = useOrders();
  const users = useUsers();

  const drivers = useQuery({
    queryKey: ["admin-drivers"],
    queryFn: getAdminDrivers,
  });

  const branches = useQuery({
    queryKey: ["admin-branches"],
    queryFn: getAdminBranches,
  });

  return {
    categories,
    products,
    orders,
    users,
    drivers,
    branches,
  };
}
