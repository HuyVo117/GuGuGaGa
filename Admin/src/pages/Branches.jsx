import { useState, useEffect } from "react";
import { Search, Plus, MoreVertical, Edit, Trash2, Building2 } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
import BranchDialog from "../components/dialogs/BranchDialog";
import { branchService } from "../services/branchService";
import toast from "react-hot-toast";

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await branchService.getAll();
      if (response.success) {
        setBranches(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      toast.error("Không thể tải danh sách chi nhánh");
    } finally {
      setLoading(false);
    }
  };

  const filteredBranches = branches.filter(
    (branch) =>
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.phone?.includes(searchTerm)
  );

  const handleAdd = () => {
    setSelectedBranch(null);
    setDialogOpen(true);
  };

  const handleEdit = (branch) => {
    setSelectedBranch(branch);
    setDialogOpen(true);
  };

  const handleDelete = (branch) => {
    setBranchToDelete(branch);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (branchToDelete) {
      try {
        await branchService.delete(branchToDelete.id);
        toast.success("Xóa chi nhánh thành công");
        fetchBranches();
      } catch (error) {
        console.error("Failed to delete branch:", error);
        toast.error("Không thể xóa chi nhánh");
      } finally {
        setDeleteDialogOpen(false);
        setBranchToDelete(null);
      }
    }
  };

  const handleSave = async (branchData) => {
    try {
      if (branchData.id) {
        // Update existing branch
        await branchService.update(branchData.id, branchData);
        toast.success("Cập nhật chi nhánh thành công");
      } else {
        // Add new branch
        await branchService.create(branchData);
        toast.success("Thêm chi nhánh thành công");
      }
      fetchBranches();
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to save branch:", error);
      toast.error("Không thể lưu chi nhánh");
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Chi nhánh
          </h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">
            Quản lý các chi nhánh trong hệ thống
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
        >
          <Plus size={20} />
          <span>Thêm chi nhánh</span>
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
            placeholder="Tìm kiếm chi nhánh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Branches Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chi nhánh
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Liên hệ
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    Đang tải...
                  </td>
                </tr>
              ) : filteredBranches.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    Không tìm thấy chi nhánh nào
                  </td>
                </tr>
              ) : (
                filteredBranches.map((branch) => (
                  <tr
                    key={branch.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <Building2 size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {branch.name}
                          </div>
                          {branch.address && (
                            <div className="text-xs text-gray-500 md:hidden mt-1 truncate max-w-xs">
                              {branch.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 hidden lg:table-cell">
                      <div>
                        {branch.phone && (
                          <div className="text-sm text-gray-900">{branch.phone}</div>
                        )}
                        {branch.address && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {branch.address}
                          </div>
                        )}
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
                              onClick={() => handleEdit(branch)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none"
                            >
                              <Edit size={16} />
                              Chỉnh sửa
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onClick={() => handleDelete(branch)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded cursor-pointer outline-none"
                            >
                              <Trash2 size={16} />
                              Xóa
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

      {/* Branch Dialog */}
      <BranchDialog
        key={selectedBranch?.id || "new"}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedBranch(null);
        }}
        branch={selectedBranch}
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
              Bạn có chắc chắn muốn xóa chi nhánh{" "}
              <strong>{branchToDelete?.name}</strong>? Hành động này không thể
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
    </div>
  );
}

