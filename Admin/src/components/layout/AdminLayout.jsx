import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FolderTree,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Building2,
  Box,
  Truck,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Avatar from "@radix-ui/react-avatar";
import * as Separator from "@radix-ui/react-separator";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Người dùng", path: "/users" },
  { icon: Building2, label: "Chi nhánh", path: "/branches" },
  { icon: FolderTree, label: "Danh mục", path: "/categories" },
  { icon: Package, label: "Món ăn", path: "/products" },
  { icon: Box, label: "Combo", path: "/combos" },
  { icon: Truck, label: "Tài xế", path: "/drivers" },
  { icon: ShoppingCart, label: "Đơn hàng", path: "/orders" },
  { icon: Settings, label: "Cài đặt", path: "/settings" },
];

import useSignOut from "../../hooks/useSignOut";
import useAuthUser from "../../hooks/useAuthUser";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { signOutMutation } = useSignOut();
  const { authUser } = useAuthUser();

  // Responsive: đóng sidebar trên mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0 lg:w-20"
        } fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${
          !sidebarOpen && "hidden lg:flex"
        } ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 shrink-0">
          {sidebarOpen && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              ChickenGoo Management
            </h1>
          )}
          <button
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              setMobileMenuOpen(false);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 font-medium shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200 shrink-0">
            <div className="flex items-center gap-3">
              <Avatar.Root className="inline-flex h-10 w-10 select-none items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                <Avatar.Image
                  className="h-full w-full rounded-[inherit] object-cover"
                  src={authUser?.avatar || "https://i.pravatar.cc/150?img=12"}
                  alt="Avatar"
                />
                <Avatar.Fallback className="text-sm font-medium leading-1 text-white">
                  {authUser?.fullName?.charAt(0) || "AD"}
                </Avatar.Fallback>
              </Avatar.Root>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {authUser?.fullName || "Admin User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {authUser?.email || "admin@example.com"}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-4 flex-1 max-w-md ml-4 lg:ml-0">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Menu */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 px-2 lg:px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Avatar.Root className="inline-flex h-8 w-8 select-none items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                    <Avatar.Image
                      className="h-full w-full rounded-[inherit] object-cover"
                      src={authUser?.avatar || "https://i.pravatar.cc/150?img=12"}
                      alt="Avatar"
                    />
                    <Avatar.Fallback className="text-xs font-medium leading-1 text-white">
                      {authUser?.fullName?.charAt(0) || "AD"}
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <ChevronDown
                    size={16}
                    className="text-gray-600 hidden lg:block"
                  />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[220px] bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-50"
                  sideOffset={5}
                >
                  <DropdownMenu.Item className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none">
                    Hồ sơ
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none">
                    Cài đặt
                  </DropdownMenu.Item>
                  <Separator.Root className="h-px bg-gray-200 my-1" />
                  <DropdownMenu.Item 
                    className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded cursor-pointer outline-none"
                    onClick={() => signOutMutation()}
                  >
                    Đăng xuất
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
