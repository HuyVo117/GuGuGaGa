import { useState } from "react";
import { Search, Filter, MoreVertical, Eye, Package, X, Truck } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
import Pagination from "../components/Pagination";
import useOrders from "../hooks/useOrders";
import { driverService } from "../services/driverService";

export default function Orders() {
  const { orders, loading, updateOrderStatus, assignDriver } = useOrders();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order._id || order.id).toString().includes(searchTerm) ||
      (order.deliveryPhone && order.deliveryPhone.includes(searchTerm)) ||
      (order.deliveryAddress &&
        order.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const validPage =
    currentPage > totalPages && totalPages > 0 ? 1 : currentPage;
  const startIndex = (validPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "ACCEPTED":
        return "bg-blue-100 text-blue-700";
      case "DRIVER_ASSIGNED":
        return "bg-purple-100 text-purple-700";
      case "DELIVERED":
        return "bg-green-100 text-green-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "PENDING":
        return "Chờ xử lý";
      case "ACCEPTED":
        return "Đã chấp nhận";
      case "DRIVER_ASSIGNED":
        return "Đã gán tài xế";
      case "DELIVERED":
        return "Đã giao hàng";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case "COD":
        return "Thanh toán khi nhận hàng";
      case "MOMO":
        return "Ví MoMo";
      default:
        return method;
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  const handleUpdateStatus = (order) => {
    setSelectedOrder(order);
    setStatusDialogOpen(true);
  };

  const confirmStatusUpdate = async (newStatus) => {
    if (selectedOrder) {
      const success = await updateOrderStatus(
        selectedOrder._id || selectedOrder.id,
        newStatus
      );
      if (success) {
        setStatusDialogOpen(false);
        setSelectedOrder(null);
      }
    }
  };

  const handleAssignDriver = async (order) => {
    setSelectedOrder(order);
    try {
      const data = await driverService.getAll();
      setDrivers(data.data || data);
      setAssignDialogOpen(true);
    } catch (error) {
      console.error(error);
    }
  };

  const confirmAssign = async (driverId) => {
    if (selectedOrder && driverId) {
      const success = await assignDriver(
        selectedOrder._id || selectedOrder.id,
        driverId
      );
      if (success) {
        setAssignDialogOpen(false);
        setSelectedOrder(null);
      }
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Đơn hàng
        </h1>
        <p className="text-gray-600 mt-1 text-sm lg:text-base">
          Quản lý tất cả đơn hàng
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm kiếm đơn hàng..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer w-full md:w-auto"
            >
              <option value="all">Tất cả</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="ACCEPTED">Đã chấp nhận</option>
              <option value="DRIVER_ASSIGNED">Đã gán tài xế</option>
              <option value="DELIVERED">Đã giao hàng</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã đơn hàng
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Chi nhánh
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Thông tin giao hàng
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Tài xế
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Phương thức thanh toán
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {orders.length === 0
                      ? "Chưa có dữ liệu..."
                      : "Không tìm thấy đơn hàng nào"}
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr
                    key={order._id || order.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{order._id || order.id}
                      </div>
                      <div className="text-xs text-gray-500 md:hidden mt-1">
                        {order.branchName || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500 md:hidden mt-1">
                        {order.deliveryPhone}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 hidden md:table-cell">
                      <div className="text-sm text-gray-900">
                        {order.branch?.name || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 hidden md:table-cell">
                      <div>
                        <div className="text-sm text-gray-900">
                          {order.deliveryPhone}
                        </div>
                        {order.deliveryAddress && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {order.deliveryAddress}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 hidden md:table-cell">
                      <div className="text-sm text-gray-900">
                        {order.driver?.name || (
                          <span className="text-gray-400 italic">Chưa gán</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-900">
                        {getPaymentMethodText(order.paymentMethod)}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatPrice(order.totalAmount)}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <MoreVertical size={18} className="text-gray-600" />
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            className="min-w-[180px] bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-50"
                            sideOffset={5}
                          >
                            <DropdownMenu.Item
                              onClick={() => handleViewDetail(order)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none"
                            >
                              <Eye size={16} />
                              Xem chi tiết
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onClick={() => handleUpdateStatus(order)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none"
                            >
                              <Package size={16} />
                              Cập nhật trạng thái
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onClick={() => handleAssignDriver(order)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none"
                            >
                              <Truck size={16} />
                              Gán tài xế
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={validPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredOrders.length}
          />
        )}
      </div>

      {/* Order Detail Dialog */}
      <Dialog.Root open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50 p-6">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Chi tiết đơn hàng
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>

            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Mã đơn hàng</p>
                    <p className="font-semibold text-gray-900">
                      #{selectedOrder._id || selectedOrder.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ngày tạo</p>
                    <p className="font-semibold text-gray-900">
                      {selectedOrder.createdAt}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Số điện thoại</p>
                    <p className="font-semibold text-gray-900">
                      {selectedOrder.deliveryPhone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      Phương thức thanh toán
                    </p>
                    <p className="font-semibold text-gray-900">
                      {getPaymentMethodText(selectedOrder.paymentMethod)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Địa chỉ giao hàng</p>
                    <p className="font-semibold text-gray-900">
                      {selectedOrder.deliveryAddress}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-2">Chi tiết đơn hàng</p>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      {selectedOrder.orderItem?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.product?.name || item.combo?.name || "Sản phẩm không xác định"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.combo ? "Combo" : "Sản phẩm"} x {item.quantity}
                            </p>
                          </div>
                          <p className="font-medium text-gray-900">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2 border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">Tổng tiền</p>
                      <p className="font-bold text-gray-900 text-lg">
                        {formatPrice(selectedOrder.totalAmount)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Trạng thái</p>
                    <span
                      className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                        selectedOrder.status
                      )}`}
                    >
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Update Status Dialog */}
      <Dialog.Root open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl w-full max-w-md z-50 p-6">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Cập nhật trạng thái
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>

            {selectedOrder && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Đơn hàng:{" "}
                  <strong>#{selectedOrder._id || selectedOrder.id}</strong>
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái mới
                  </label>
                  <select
                    id="status-select"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue={selectedOrder.status}
                  >
                    <option value="PENDING">Chờ xử lý</option>
                    <option value="ACCEPTED">Đã chấp nhận</option>
                    <option value="DRIVER_ASSIGNED">Đã gán tài xế</option>
                    <option value="DELIVERED">Đã giao hàng</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <Dialog.Close asChild>
                    <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Hủy
                    </button>
                  </Dialog.Close>
                  <button
                    onClick={() => {
                      const select = document.getElementById("status-select");
                      confirmStatusUpdate(select.value);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Cập nhật
                  </button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Assign Driver Dialog */}
      <Dialog.Root open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl w-full max-w-md z-50 p-6">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Gán tài xế
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>

            {selectedOrder && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Đơn hàng:{" "}
                  <strong>#{selectedOrder._id || selectedOrder.id}</strong>
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn tài xế
                  </label>
                  <select
                    id="driver-select"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      -- Chọn tài xế --
                    </option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} - {driver.status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <Dialog.Close asChild>
                    <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Hủy
                    </button>
                  </Dialog.Close>
                  <button
                    onClick={() => {
                      const select = document.getElementById("driver-select");
                      if (select.value) {
                        confirmAssign(select.value);
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
