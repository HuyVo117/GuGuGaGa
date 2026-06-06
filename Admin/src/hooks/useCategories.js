import { useState, useEffect, useCallback } from "react";
import { categoryService } from "../services/categoryService";
import { toast } from "react-hot-toast";

export default function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoryService.getAllCategories();
      if (data.data && Array.isArray(data.data)) {
        setCategories(data.data);
      } else if (Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories([]);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setError(err);
      toast.error("Không thể tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = async (categoryData) => {
    try {
      await categoryService.createCategory(categoryData);
      toast.success("Thêm danh mục thành công");
      fetchCategories();
      return true;
    } catch (err) {
      console.error("Failed to create category:", err);
      toast.error("Thêm danh mục thất bại");
      return false;
    }
  };

  const updateCategory = async (id, categoryData) => {
    try {
      await categoryService.updateCategory(id, categoryData);
      toast.success("Cập nhật danh mục thành công");
      fetchCategories();
      return true;
    } catch (err) {
      console.error("Failed to update category:", err);
      toast.error("Cập nhật danh mục thất bại");
      return false;
    }
  };

  const deleteCategory = async (id) => {
    try {
      await categoryService.deleteCategory(id);
      toast.success("Xóa danh mục thành công");
      fetchCategories();
      return true;
    } catch (err) {
      console.error("Failed to delete category:", err);
      toast.error("Xóa danh mục thất bại");
      return false;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
