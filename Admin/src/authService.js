import api from "./axios";

export async function loginAdmin(email, password) {
  const { data } = await api.post("/admin/auth/login", { email, password });
  localStorage.setItem("admin_token", data.token);
  return data;
}

export async function getAuthUser() {
  const { data } = await api.get("/admin/auth/me");
  return data.user;
}

export function logoutAdmin() {
  localStorage.removeItem("admin_token");
}
