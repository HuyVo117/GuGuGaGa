import { Navigate, Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import SignInPage from "./pages/SignInPage";
import { useAuthUser } from "./hooks/useAuthUser";

function ProtectedRoute() {
  const { data, isLoading, isError } = useAuthUser();

  if (isLoading) return <p className="muted">Dang tai...</p>;
  if (isError || !data) return <Navigate to="/login" replace />;

  return <DashboardPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<SignInPage />} />
      <Route path="/" element={<ProtectedRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


