import { api } from "../lib/axios.js";

export const authService = {
  async signIn(signInData) {
    const response = await api.post("/auth/sign-in", signInData);
    return response.data;
  },
  async signOut() {
    const response = await api.post("/auth/sign-out");
    return response.data;
  },
  async getAuthUser() {
    try {
      const res = await api.get("/auth/me");
      console.log(res.data.data.user); // gọi /auth/me
      return res.data.data.user; // { success, user }
    } catch (err) {
      console.error("Error in getAuthUser:", err);
      return null;
    }
  },
};
