import {
  TrendingUp,
  Users,
  Package,
  DollarSign,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { dashboardService } from "../services/dashboardService";

const recentOrders = [
  {
    id: "#ORD-001",
    customer: "Nguyễn Văn A",
    product: "Combo Gia Đình",
    amount: "199,000₫",
    status: "completed",
  },
  {
    id: "#ORD-002",
    customer: "Trần Thị B",
    product: "Gà rán giòn cay + Khoai tây",
    amount: "134,000₫",
    status: "pending",
  },
  {
    id: "#ORD-003",
    customer: "Lê Văn C",
    product: "Combo Đôi",
    amount: "149,000₫",
    status: "processing",
  },
  {
    id: "#ORD-004",
    customer: "Phạm Thị D",
    product: "Combo Cá Nhân",
    amount: "99,000₫",
    status: "completed",
  },
  {
    id: "#ORD-005",
    customer: "Hoàng Văn E",
    product: "Gà rán không cay + Đồ uống",
    amount: "114,000₫",
    status: "pending",
  },
];

export default function Dashboard() {
  const [statsData, setStatsData] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardService.getStats();
        if (response.success) {
          setStatsData(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    {
      title: "Tổng doanh thu",
      value: statsData.totalRevenue.toLocaleString("vi-VN") + "₫",
      change: "+0%", // Placeholder
      trend: "up",
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      title: "Khách hàng",
      value: statsData.totalUsers,
      change: "+0%",
      trend: "up",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Món ăn",
      value: statsData.totalProducts,
      change: "+0%",
      trend: "up",
      icon: Package,
      color: "bg-purple-500",
    },
    {
      title: "Đơn hàng",
      value: statsData.totalOrders,
      change: "+0%",
      trend: "up",
      icon: ShoppingCart,
      color: "bg-orange-500",
    },
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Chào mừng trở lại! Đây là tổng quan về nhà hàng gà rán của bạn.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.trend === "up" ? (
                      <ArrowUpRight size={16} className="text-green-500" />
                    ) : (
                      <ArrowDownRight size={16} className="text-red-500" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        stat.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500">
                      so với tháng trước
                    </span>
                  </div>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Đơn hàng gần đây
            </h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Xem tất cả
            </button>
          </div>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{order.id}</p>
                      <p className="text-sm text-gray-600">{order.customer}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{order.product}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{order.amount}</p>
                  <span
                    className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                      order.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : order.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {order.status === "completed"
                      ? "Hoàn thành"
                      : order.status === "pending"
                      ? "Chờ xử lý"
                      : "Đang xử lý"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Hoạt động
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  Doanh thu tăng 18.5%
                </p>
                <p className="text-sm text-gray-500">2 giờ trước</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">25 khách hàng mới</p>
                <p className="text-sm text-gray-500">5 giờ trước</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package size={20} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  3 món ăn mới được thêm
                </p>
                <p className="text-sm text-gray-500">1 ngày trước</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
