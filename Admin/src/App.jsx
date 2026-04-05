import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthUser } from "./hooks/useAuthUser";
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
  loginAdmin,
  logoutAdmin,
  updateOrderStatus,
} from "./authService";

function LoginPage() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await loginAdmin(email, password);
      window.location.reload();
    } catch {
      setError("Dang nhap that bai");
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: "48px auto", fontFamily: "sans-serif" }}>
      <h2>GuGuGaGa Admin</h2>
      <form onSubmit={handleSubmit}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={{ width: "100%", marginBottom: 8, padding: 8 }}
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
          style={{ width: "100%", marginBottom: 8, padding: 8 }}
        />
        <button type="submit" style={{ width: "100%", padding: 8 }}>
          Dang nhap
        </button>
      </form>
      {error ? <p style={{ color: "red" }}>{error}</p> : null}
    </div>
  );
}

function Dashboard() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("39000");
  const [categoryId, setCategoryId] = useState("");
  const [driverSelection, setDriverSelection] = useState({});

  const { data: categories = [], isLoading: categoryLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: getAdminCategories,
  });

  const { data: products = [], isLoading: productLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: getAdminProducts,
  });

  const { data: orders = [], isLoading: orderLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: getAdminOrders,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["admin-drivers"],
    queryFn: getAdminDrivers,
  });

  const { data: users = [], isLoading: userLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAdminUsers,
  });

  const { data: branches = [], isLoading: branchLoading } = useQuery({
    queryKey: ["admin-branches"],
    queryFn: getAdminBranches,
  });

  const createProductMutation = useMutation({
    mutationFn: createAdminProduct,
    onSuccess: async () => {
      setName("");
      setPrice("39000");
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteAdminProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, payload, action }) => {
      if (action === "assign-driver") {
        return assignDriverToOrder(id, payload.driverId);
      }
      return updateOrderStatus(id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });

  const handleCreateProduct = (event) => {
    event.preventDefault();
    createProductMutation.mutate({
      name,
      price: Number(price),
      categoryId: Number(categoryId),
    });
  };

  const handleAssignDriverToOrder = (orderId) => {
    const selectedDriverId = Number(driverSelection[orderId] || 0);
    if (!selectedDriverId) return;

    updateOrderMutation.mutate({
      id: orderId,
      payload: { driverId: selectedDriverId },
      action: "assign-driver",
    });
  };

  return (
    <div style={{ maxWidth: 860, margin: "24px auto", fontFamily: "sans-serif" }}>
      <h1>Admin Dashboard</h1>
      <p>Trang quan tri san pham, don hang, nguoi dung, chi nhanh va tai xe.</p>
      <button onClick={logoutAdmin}>Dang xuat</button>

      <section style={{ marginTop: 24 }}>
        <h2>Tao san pham moi</h2>
        {categoryLoading ? <p>Dang tai category...</p> : null}
        <form onSubmit={handleCreateProduct}>
          <input
            placeholder="Ten san pham"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ marginRight: 8, padding: 6 }}
          />
          <input
            placeholder="Gia"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{ marginRight: 8, padding: 6 }}
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            style={{ marginRight: 8, padding: 6 }}
          >
            <option value="">Chon category</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={createProductMutation.isPending}>
            Tao san pham
          </button>
        </form>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Danh sach san pham</h2>
        {productLoading ? <p>Dang tai products...</p> : null}
        {!productLoading && products.length === 0 ? <p>Chua co san pham.</p> : null}
        {!productLoading
          ? products.map((item) => (
              <div
                key={item.id}
                style={{ border: "1px solid #ddd", borderRadius: 6, padding: 10, marginBottom: 8 }}
              >
                <strong>{item.name}</strong> - {item.price} VND ({item.category?.name || "No category"})
                <div>
                  <button
                    onClick={() => deleteProductMutation.mutate(item.id)}
                    style={{ marginTop: 6 }}
                    disabled={deleteProductMutation.isPending}
                  >
                    Xoa
                  </button>
                </div>
              </div>
            ))
          : null}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Danh sach don hang</h2>
        {orderLoading ? <p>Dang tai orders...</p> : null}
        {!orderLoading && orders.length === 0 ? <p>Chua co don hang.</p> : null}
        {!orderLoading
          ? orders.map((item) => (
              <div
                key={item.id}
                style={{ border: "1px solid #ddd", borderRadius: 6, padding: 10, marginBottom: 8 }}
              >
                <p>
                  <strong>Don #{item.id}</strong> - {item.status} - User: {item.user?.email}
                </p>
                <p>Driver: {item.driver?.name || item.driver?.phone || "Chua gan"}</p>
                <p>Tong tien: {item.totalAmount || 0} VND</p>
                <button
                  onClick={() =>
                    updateOrderMutation.mutate({
                      id: item.id,
                      payload: { status: "ACCEPTED" },
                    })
                  }
                  style={{ marginRight: 8 }}
                >
                  Xac nhan don
                </button>
                <button
                  onClick={() =>
                    updateOrderMutation.mutate({
                      id: item.id,
                      payload: { status: "DRIVER_ASSIGNED" },
                    })
                  }
                  style={{ marginRight: 8 }}
                >
                  Dang giao
                </button>
                <button
                  onClick={() =>
                    updateOrderMutation.mutate({
                      id: item.id,
                      payload: { status: "DELIVERED" },
                    })
                  }
                  style={{ marginRight: 8 }}
                >
                  Da giao
                </button>

                {drivers.length > 0 ? (
                  <>
                    <select
                      value={driverSelection[item.id] || ""}
                      onChange={(event) =>
                        setDriverSelection((prev) => ({
                          ...prev,
                          [item.id]: event.target.value,
                        }))
                      }
                      style={{ marginRight: 8, padding: 4 }}
                    >
                      <option value="">Chon driver</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} - {driver.phone} ({driver.status})
                        </option>
                      ))}
                    </select>
                    <button onClick={() => handleAssignDriverToOrder(item.id)}>Gan driver</button>
                  </>
                ) : null}
              </div>
            ))
          : null}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Danh sach driver</h2>
        {drivers.length === 0 ? <p>Chua co driver.</p> : null}
        {drivers.map((item) => (
          <div
            key={item.id}
            style={{ border: "1px solid #ddd", borderRadius: 6, padding: 10, marginBottom: 8 }}
          >
            <strong>{item.name}</strong> - {item.phone} - {item.status}
          </div>
        ))}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Danh sach user</h2>
        {userLoading ? <p>Dang tai users...</p> : null}
        {!userLoading && users.length === 0 ? <p>Chua co user.</p> : null}
        {!userLoading
          ? users.map((item) => (
              <div
                key={item.id}
                style={{ border: "1px solid #ddd", borderRadius: 6, padding: 10, marginBottom: 8 }}
              >
                <strong>{item.name}</strong> - {item.phone} - {item.email} - role: {item.role}
              </div>
            ))
          : null}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Danh sach chi nhanh</h2>
        {branchLoading ? <p>Dang tai branches...</p> : null}
        {!branchLoading && branches.length === 0 ? <p>Chua co chi nhanh.</p> : null}
        {!branchLoading
          ? branches.map((item) => (
              <div
                key={item.id}
                style={{ border: "1px solid #ddd", borderRadius: 6, padding: 10, marginBottom: 8 }}
              >
                <strong>{item.name}</strong> - {item.address}
              </div>
            ))
          : null}
      </section>
    </div>
  );
}

function ProtectedRoute() {
  const { data, isLoading, isError } = useAuthUser();

  if (isLoading) return <p>Dang tai...</p>;
  if (isError || !data) return <Navigate to="/login" replace />;

  return <Dashboard />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


