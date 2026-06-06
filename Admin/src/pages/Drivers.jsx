import { useState, useEffect } from "react";
import { Search, Plus, MoreVertical, Edit, Trash2, Truck, Star, MessageSquare } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
import DriverDialog from "../components/dialogs/DriverDialog";
import { driverService } from "../services/driverService";
import { branchService } from "../services/branchService";
import { reviewService } from "../services/reviewService";
import { toast } from "react-hot-toast";

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewDriver, setReviewDriver] = useState(null);
  const [driverReviews, setDriverReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Fetch drivers
  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const data = await driverService.getAll();
      setDrivers(data.data || data); // Adjust based on API response structure
    } catch (error) {
      console.error("Failed to fetch drivers:", error);
      toast.error("Không thể tải danh sách tài xế");
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await branchService.getAll();
      if (response.success) {
        setBranches(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch branches:", error);
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchBranches();
  }, []);

  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone.includes(searchTerm) ||
      driver.branch?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedDriver(null);
    setDialogOpen(true);
  };

  const handleEdit = (driver) => {
    setSelectedDriver(driver);
    setDialogOpen(true);
  };

  const handleDelete = (driver) => {
    setDriverToDelete(driver);
    setDeleteDialogOpen(true);
  };

  const handleViewReviews = async (driver) => {
    setReviewDriver(driver);
    setReviewDialogOpen(true);
    setLoadingReviews(true);
    try {
      const response = await reviewService.getDriverReviews(driver.id);
      setDriverReviews(response.data || []);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      toast.error("Không thể tải đánh giá");
      setDriverReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const confirmDelete = async () => {
    if (driverToDelete) {
      try {
        await driverService.delete(driverToDelete.id);
        toast.success("Xóa tài xế thành công");
        fetchDrivers();
      } catch (error) {
        console.error("Failed to delete driver:", error);
        toast.error("Xóa tài xế thất bại");
      }
      setDeleteDialogOpen(false);
      setDriverToDelete(null);
    }
  };

  const handleSave = async (driverData) => {
    try {
      if (driverData.id) {
        await driverService.update(driverData.id, driverData);
        toast.success("Cập nhật tài xế thành công");
      } else {
        await driverService.create(driverData);
        toast.success("Thêm tài xế thành công");
      }
      fetchDrivers();
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to save driver:", error);
      toast.error("Lưu tài xế thất bại");
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "Sẵn sàng";
      case "ON_DELIVERY":
        return "Đang giao hàng";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-700";
      case "ON_DELIVERY":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Tài xế</h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">
            Quản lý tất cả tài xế trong hệ thống
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
        >
          <Plus size={20} />
          <span>Thêm tài xế</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Tìm kiếm tài xế..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tài xế
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Chi nhánh
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số điện thoại
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Đánh giá
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDrivers.length === 0 ? (
                <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Không tìm thấy tài xế nào
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((driver) => (
                  <tr
                    key={driver.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <Truck size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {driver.name}
                          </div>
                          <div className="text-xs text-gray-400 md:hidden mt-1">
                            {driver.branch?.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">{driver.branch?.name}</div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{driver.phone}</div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          driver.status
                        )}`}
                      >
                        {getStatusLabel(driver.status)}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-amber-400 fill-amber-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {driver.rating ? Number(driver.rating).toFixed(1) : "--"}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({driver.reviewCount || 0})
                        </span>
                      </div>
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
                              onClick={() => handleEdit(driver)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none"
                            >
                              <Edit size={16} />
                              Chỉnh sửa
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onClick={() => handleDelete(driver)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded cursor-pointer outline-none"
                            >
                              <Trash2 size={16} />
                              Xóa
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                            <DropdownMenu.Item
                              onClick={() => handleViewReviews(driver)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 rounded cursor-pointer outline-none"
                            >
                              <MessageSquare size={16} />
                              Xem đánh giá
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
      </div>

      <DriverDialog
        key={selectedDriver?.id ? `edit-${selectedDriver.id}` : `new-${dialogOpen}`}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedDriver(null);
        }}
        driver={selectedDriver}
        branches={branches}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl w-full max-w-md z-50 p-6">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
              Xác nhận xóa
            </Dialog.Title>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa tài xế{" "}
              <strong>{driverToDelete?.name}</strong>? Hành động này không thể
              hoàn tác.
            </p>
            <div className="flex gap-3">
              <Dialog.Close asChild>
                <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Hủy
                </button>
              </Dialog.Close>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Driver Reviews Dialog */}
      <Dialog.Root open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl w-full max-w-lg z-50 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <Dialog.Title className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Star size={20} className="text-amber-400 fill-amber-400" />
                Đánh giá của {reviewDriver?.name}
              </Dialog.Title>
              {reviewDriver && (
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={18}
                        className={s <= Math.round(reviewDriver.rating || 0) ? "text-amber-400 fill-amber-400" : "text-gray-300"}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {reviewDriver.rating ? Number(reviewDriver.rating).toFixed(1) : "--"}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({reviewDriver.reviewCount || 0} đánh giá)
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingReviews ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
                </div>
              ) : driverReviews.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Chưa có đánh giá nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {driverReviews.map((review, idx) => {
                    const rating = review.rating || 5;
                    let timeStr = "";
                    if (review.createdAt) {
                      try {
                        const date = review.createdAt._seconds
                          ? new Date(review.createdAt._seconds * 1000)
                          : new Date(review.createdAt);
                        const diffMs = Date.now() - date.getTime();
                        const diffMins = Math.floor(diffMs / 60000);
                        const diffHours = Math.floor(diffMins / 60);
                        const diffDays = Math.floor(diffHours / 24);
                        if (diffDays > 0) timeStr = `${diffDays} ngày trước`;
                        else if (diffHours > 0) timeStr = `${diffHours} giờ trước`;
                        else timeStr = `${Math.max(1, diffMins)} phút trước`;
                      } catch (e) {}
                    }
                    return (
                      <div key={idx} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-amber-600">
                                {(review.userName || "K")[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{review.userName || "Khách hàng"}</p>
                              {timeStr && <p className="text-xs text-gray-400">{timeStr}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={14}
                                className={s <= rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 mt-2">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100">
              <Dialog.Close asChild>
                <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                  Đóng
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
