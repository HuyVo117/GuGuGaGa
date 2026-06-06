import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Users from "./pages/Users.jsx";
import Products from "./pages/Products.jsx";
import Orders from "./pages/Orders.jsx";
import Categories from "./pages/Categories.jsx";
import Branches from "./pages/Branches.jsx";
import Combos from "./pages/Combos.jsx";
import Drivers from "./pages/Drivers.jsx";
import Settings from "./pages/Settings.jsx";

import AdminLayout from "./components/layout/AdminLayout.jsx";
import PageLoader from "./components/dialogs/PageLoader.jsx";
import useAuthUser from "./hooks/useAuthUser.js";

const App = () => {
  const { isLoading, authUser } = useAuthUser();
  const isAuthenticated = Boolean(authUser);

  if (isLoading) return <PageLoader />;

  return (
    <Routes>
      {/* LOGIN */}
      <Route
        path="/login"
        element={
          !isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />
        }
      />

      {/* ADMIN LAYOUT WITH NESTED ROUTES */}
      {isAuthenticated && (
        <Route path="/" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} />
          <Route path="categories" element={<Categories />} />
          <Route path="branches" element={<Branches />} />
          <Route path="combos" element={<Combos />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="settings" element={<Settings />} />
          {/* Default: redirect / -> /dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      )}

      {/* Catch-all */}
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};

export default App;
