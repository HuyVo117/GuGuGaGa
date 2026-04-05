import { api } from "../lib/axios";

export const driverService = {
  getAll: async () => {
    const response = await api.get("/drivers");
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/drivers/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post("/drivers", data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/drivers/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/drivers/${id}`);
    return response.data;
  },
};
