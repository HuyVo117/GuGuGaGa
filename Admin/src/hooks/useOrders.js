import { useState, useEffect, useCallback } from "react";
import { orderService } from "../services/orderService";
import { toast } from "react-hot-toast";

export default function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await orderService.getAll();
      if (data.data && Array.isArray(data.data)) {
        setOrders(data.data);
      } else if (Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders([]);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError(err);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = async (id, status) => {
    try {
      await orderService.updateStatus(id, status);
      toast.success("Cập nhật trạng thái thành công");
      fetchOrders();
      return true;
    } catch (err) {
      console.error("Failed to update order status:", err);
      toast.error("Cập nhật trạng thái thất bại");
      return false;
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    updateOrderStatus,
    assignDriver: async (orderId, driverId) => {
      try {
        await orderService.assignDriver(orderId, driverId);
        toast.success("Gán tài xế thành công");
        fetchOrders();
        return true;
      } catch (err) {
        console.error("Failed to assign driver:", err);
        toast.error("Gán tài xế thất bại");
        return false;
      }
    },
  };
}
