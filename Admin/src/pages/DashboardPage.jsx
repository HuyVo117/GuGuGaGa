import { useState } from "react";
import AdminLayout from "../components/layout/AdminLayout";
import { useDashboard } from "../hooks/useDashboard";
import { useSignOut } from "../hooks/useSignOut";

function Section({ title, children }) {
  return (
    <section className="section-card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("39000");
  const [categoryId, setCategoryId] = useState("");
  const [driverSelection, setDriverSelection] = useState({});
  const signOut = useSignOut();

  const { categories, products, orders, users, drivers, branches } = useDashboard();

  const categoriesData = categories.data || [];
  const productsData = products.data || [];
  const ordersData = orders.data || [];
  const usersData = users.data || [];
  const driversData = drivers.data || [];
  const branchesData = branches.data || [];

  const handleCreateProduct = (event) => {
    event.preventDefault();
    if (!name.trim() || !price || !categoryId) return;

    products.createMutation.mutate(
      {
        name: name.trim(),
        price: Number(price),
        categoryId: Number(categoryId),
      },
      {
        onSuccess: () => {
          setName("");
          setPrice("39000");
        },
      }
    );
  };

  const handleAssignDriverToOrder = (orderId) => {
    const selectedDriverId = Number(driverSelection[orderId] || 0);
    if (!selectedDriverId) return;
    orders.assignDriverMutation.mutate({ id: orderId, driverId: selectedDriverId });
  };

  const stats = [
    { label: "San pham", value: productsData.length },
    { label: "Don hang", value: ordersData.length },
    { label: "Tai xe", value: driversData.length },
    { label: "Nguoi dung", value: usersData.length },
    { label: "Chi nhanh", value: branchesData.length },
  ];

  return (
    <AdminLayout
      title="GuGuGaGa Control Deck"
      subtitle="Quan ly menu, don giao, doi shipper va thong tin van hanh theo thoi gian thuc."
      onSignOut={signOut}
    >
      <section className="stats-grid">
        {stats.map((item) => (
          <article key={item.label} className="stat-card">
            <span className="muted">{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <Section title="Tao san pham moi">
        {categories.isLoading ? <p className="muted">Dang tai category...</p> : null}
        <form className="create-form" onSubmit={handleCreateProduct}>
          <input className="field" placeholder="Ten san pham" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="field" placeholder="Gia" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          <select className="field" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Chon category</option>
            {categoriesData.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" type="submit" disabled={products.createMutation.isPending}>
            Tao san pham
          </button>
        </form>
      </Section>

      <Section title="Danh sach san pham">
        {products.isLoading ? <p className="muted">Dang tai products...</p> : null}
        {!products.isLoading && productsData.length === 0 ? <p className="muted">Chua co san pham.</p> : null}
        {!products.isLoading
          ? productsData.map((item) => (
              <div key={item.id} className="item">
                <strong>{item.name}</strong> - {item.price} VND ({item.category?.name || "No category"})
                <div>
                  <button
                    className="btn btn-danger"
                    onClick={() => products.deleteMutation.mutate(item.id)}
                    disabled={products.deleteMutation.isPending}
                  >
                    Xoa
                  </button>
                </div>
              </div>
            ))
          : null}
      </Section>

      <Section title="Danh sach don hang">
        {orders.isLoading ? <p className="muted">Dang tai orders...</p> : null}
        {!orders.isLoading && ordersData.length === 0 ? <p className="muted">Chua co don hang.</p> : null}
        {!orders.isLoading
          ? ordersData.map((item) => (
              <div key={item.id} className="item">
                <p>
                  <strong>Don #{item.id}</strong> - {item.status} - User: {item.user?.email}
                </p>
                <p>Driver: {item.driver?.name || item.driver?.phone || "Chua gan"}</p>
                <p>Tong tien: {item.totalAmount || 0} VND</p>
                <div className="item-row">
                  <button
                    className="btn"
                    onClick={() => orders.updateStatusMutation.mutate({ id: item.id, payload: { status: "ACCEPTED" } })}
                  >
                    Xac nhan don
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() =>
                      orders.updateStatusMutation.mutate({ id: item.id, payload: { status: "DRIVER_ASSIGNED" } })
                    }
                  >
                    Dang giao
                  </button>
                  <button
                    className="btn"
                    onClick={() => orders.updateStatusMutation.mutate({ id: item.id, payload: { status: "DELIVERED" } })}
                  >
                    Da giao
                  </button>
                </div>

                {driversData.length > 0 ? (
                  <div className="item-row" style={{ marginTop: 8 }}>
                    <select
                      className="field"
                      value={driverSelection[item.id] || ""}
                      onChange={(event) =>
                        setDriverSelection((prev) => ({
                          ...prev,
                          [item.id]: event.target.value,
                        }))
                      }
                    >
                      <option value="">Chon driver</option>
                      {driversData.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} - {driver.phone} ({driver.status})
                        </option>
                      ))}
                    </select>
                    <button className="btn" onClick={() => handleAssignDriverToOrder(item.id)}>
                      Gan driver
                    </button>
                  </div>
                ) : null}
              </div>
            ))
          : null}
      </Section>

      <Section title="Danh sach tai xe">
        {driversData.length === 0 ? <p className="muted">Chua co driver.</p> : null}
        <div className="list">
          {driversData.map((item) => (
            <div key={item.id} className="item">
              <strong>{item.name}</strong> - {item.phone} - {item.status}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Danh sach user">
        {users.isLoading ? <p className="muted">Dang tai users...</p> : null}
        {!users.isLoading && usersData.length === 0 ? <p className="muted">Chua co user.</p> : null}
        {!users.isLoading
          ? usersData.map((item) => (
              <div key={item.id} className="item">
                <strong>{item.name}</strong> - {item.phone} - {item.email} - role: {item.role}
              </div>
            ))
          : null}
      </Section>

      <Section title="Danh sach chi nhanh">
        {branches.isLoading ? <p className="muted">Dang tai branches...</p> : null}
        {!branches.isLoading && branchesData.length === 0 ? <p className="muted">Chua co chi nhanh.</p> : null}
        {!branches.isLoading
          ? branchesData.map((item) => (
              <div key={item.id} className="item">
                <strong>{item.name}</strong> - {item.address}
              </div>
            ))
          : null}
      </Section>
    </AdminLayout>
  );
}
