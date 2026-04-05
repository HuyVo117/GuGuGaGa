import { useState, useEffect, useCallback } from "react";
import { productService } from "../services/productService";
import { toast } from "react-hot-toast";

export default function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productService.getAll();
      if (data.data && Array.isArray(data.data)) {
        setProducts(data.data);
      } else if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError(err);
      toast.error("Không thể tải danh sách món ăn");
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = async (productData) => {
    try {
      await productService.create(productData);
      toast.success("Thêm món ăn thành công");
      fetchProducts();
      return true;
    } catch (err) {
      console.error("Failed to create product:", err);
      toast.error("Thêm món ăn thất bại");
      return false;
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      // Note: Assuming update method exists or will exist. 
      // If not, this might fail or need adjustment based on service capabilities.
      // Based on previous file analysis, update might not be fully supported by backend yet,
      // but we should structure the hook to support it.
      if (productService.update) {
          await productService.update(id, productData);
          toast.success("Cập nhật món ăn thành công");
          fetchProducts();
          return true;
      } else {
          toast.error("Chức năng cập nhật chưa được hỗ trợ bởi backend");
          return false;
      }
    } catch (err) {
      console.error("Failed to update product:", err);
      toast.error("Cập nhật món ăn thất bại");
      return false;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await productService.delete(id);
      toast.success("Xóa món ăn thành công");
      fetchProducts();
      return true;
    } catch (err) {
      console.error("Failed to delete product:", err);
      toast.error("Xóa món ăn thất bại");
      return false;
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
