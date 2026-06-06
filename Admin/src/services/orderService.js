import { api } from "../lib/axios";

export const orderService = {
  getAll: async () => {
    const response = await api.get("/orders");
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },
  assignDriver: async (orderId, driverId) => {
    const response = await api.patch(`/orders/${orderId}/assign-driver`, {
      driverId,
    });
    return response.data;
  },
};
