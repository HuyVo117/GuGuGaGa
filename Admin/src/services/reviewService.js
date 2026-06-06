import axios from "axios";

// Use the public API endpoint (no auth needed for reviews)
const publicApi = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const reviewService = {
  getDriverReviews: async (driverId) => {
    const response = await publicApi.get(`/drivers/${driverId}/reviews`);
    return response.data;
  },

  getProductReviews: async (productId) => {
    const response = await publicApi.get(`/products/${productId}/reviews`);
    return response.data;
  },
};
