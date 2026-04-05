import { useState, useEffect, useCallback } from "react";
import { comboService } from "../services/comboService";
import { toast } from "react-hot-toast";

export default function useCombos() {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCombos = useCallback(async (categoryId) => {
    setLoading(true);
    try {
      const data = await comboService.getAll(categoryId);
      if (data.data && Array.isArray(data.data)) {
        setCombos(data.data);
      } else if (Array.isArray(data)) {
        setCombos(data);
      } else {
        setCombos([]);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to fetch combos:", err);
      setError(err);
      toast.error("Không thể tải danh sách combo");
    } finally {
      setLoading(false);
    }
  }, []);

  const createCombo = async (comboData) => {
    try {
      await comboService.create(comboData);
      toast.success("Thêm combo thành công");
      fetchCombos();
      return true;
    } catch (err) {
      console.error("Failed to create combo:", err);
      toast.error("Thêm combo thất bại");
      return false;
    }
  };

  const updateCombo = async (id, comboData) => {
    try {
      await comboService.update(id, comboData);
      toast.success("Cập nhật combo thành công");
      fetchCombos();
      return true;
    } catch (err) {
      console.error("Failed to update combo:", err);
      toast.error("Cập nhật combo thất bại");
      return false;
    }
  };

  const deleteCombo = async (id) => {
    try {
      await comboService.delete(id);
      toast.success("Xóa combo thành công");
      fetchCombos();
      return true;
    } catch (err) {
      console.error("Failed to delete combo:", err);
      toast.error("Xóa combo thất bại");
      return false;
    }
  };

  useEffect(() => {
    fetchCombos();
  }, [fetchCombos]);

  return {
    combos,
    loading,
    error,
    fetchCombos,
    createCombo,
    updateCombo,
    deleteCombo,
  };
}
