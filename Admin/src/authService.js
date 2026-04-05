import api from "./axios";

export async function loginAdmin(email, password) {
  const { data } = await api.post("/admin/auth/sign-in", { email, password });
  localStorage.setItem("admin_token", data.data.token);
  return data.data;
}

export async function getAuthUser() {
  const { data } = await api.get("/admin/auth/me");
  return data.data.user;
}

export async function logoutAdmin() {
  try {
    await api.post("/admin/auth/sign-out");
  } catch {
    // Ignore API errors and still clear local token.
  }
  localStorage.removeItem("admin_token");
}

export async function getAdminCategories() {
  const { data } = await api.get("/admin/categories");
  return data.data;
}

export async function getAdminProducts() {
  const { data } = await api.get("/admin/products");
  return data.data;
}

export async function createAdminProduct(payload) {
  const { data } = await api.post("/admin/products", payload);
  return data;
}

export async function deleteAdminProduct(id) {
  await api.delete(`/admin/products/${id}`);
}

export async function getAdminOrders() {
  const { data } = await api.get("/admin/orders");
  return data.data;
}

export async function getAdminDrivers() {
  const { data } = await api.get("/admin/drivers");
  return data.data;
}

export async function getAdminUsers() {
  const { data } = await api.get("/admin/users");
  return data.data;
}

export async function getAdminBranches() {
  const { data } = await api.get("/admin/branches");
  return data.data;
}

export async function updateOrderStatus(id, payload) {
  const { data } = await api.patch(`/admin/orders/${id}/status`, payload);
  return data.data;
}

export async function assignDriverToOrder(id, driverId) {
  const { data } = await api.patch(`/admin/orders/${id}/assign-driver`, { driverId });
  return data.data;
}
