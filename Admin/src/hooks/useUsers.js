import { useState, useEffect, useCallback } from "react";
import { userService } from "../services/userService";
import { toast } from "react-hot-toast";

export default function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getAll();
      if (data.data && Array.isArray(data.data)) {
        setUsers(data.data);
      } else if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError(err);
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = async (userData) => {
    try {
      await userService.create(userData);
      toast.success("Thêm người dùng thành công");
      fetchUsers();
      return true;
    } catch (err) {
      // console.error("Failed to create user:", err);
      console.error(
        "Failed to create user:",
        err.response?.data || err.message
      );
      toast.error("Thêm người dùng thất bại");
      return false;
    }
  };

  const updateUser = async (id, userData) => {
    try {
      await userService.update(id, userData);
      toast.success("Cập nhật người dùng thành công");
      fetchUsers();
      return true;
    } catch (err) {
      console.error("Failed to update user:", err);
      toast.error("Cập nhật người dùng thất bại");
      return false;
    }
  };

  const deleteUser = async (id) => {
    try {
      await userService.delete(id);
      toast.success("Xóa người dùng thành công");
      fetchUsers();
      return true;
    } catch (err) {
      console.error("Failed to delete user:", err);
      toast.error("Xóa người dùng thất bại");
      return false;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
}
