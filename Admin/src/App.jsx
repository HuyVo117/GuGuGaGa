import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthUser } from "./hooks/useAuthUser";
import { loginAdmin, logoutAdmin } from "./authService";

function LoginPage() {
  const [email, setEmail] = useState("admin@chickengoo.vn");
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
      <h2>ChickenGoo Admin</h2>
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
  return (
    <div style={{ maxWidth: 860, margin: "24px auto", fontFamily: "sans-serif" }}>
      <h1>Admin Dashboard</h1>
      <p>Trang quan tri san pham, don hang, nguoi dung, chi nhanh va tai xe.</p>
      <button onClick={logoutAdmin}>Dang xuat</button>
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
