import { api } from "../lib/axios";

export const uploadService = {
  uploadProductImage: async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await api.post("/upload/product", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
  uploadComboImage: async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await api.post("/upload/combo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
