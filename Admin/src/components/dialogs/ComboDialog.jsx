import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus, Trash2, Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import { uploadService } from "../../services/uploadService";

export default function ComboDialog({
  open,
  onClose,
  combo,
  categories,
  products,
  onSave,
}) {
  const getInitialData = () => {
    if (combo) {
      return {
        name: combo.name || "",
        categoryId: combo.categoryId || "",
        price: combo.price || "",
        desc: combo.desc || "",
        image: combo.image || "",
        comboItems: combo.comboItems || [],
      };
    }
    return {
      name: "",
      categoryId: categories?.[0]?.id || "",
      price: "",
      desc: "",
      image: "",
      comboItems: [],
    };
  };

  const [formData, setFormData] = useState(getInitialData);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(combo?.image || "");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAddProduct = () => {
    if (!selectedProductId) {
      alert("Vui lòng chọn sản phẩm!");
      return;
    }
    const product = products.find((p) => p.id === parseInt(selectedProductId));
    if (!product) return;

    // Kiểm tra xem sản phẩm đã có trong combo chưa
    const existingItem = formData.comboItems.find(
      (item) => item.productId === parseInt(selectedProductId)
    );

    if (existingItem) {
      // Cập nhật số lượng nếu đã tồn tại
      setFormData({
        ...formData,
        comboItems: formData.comboItems.map((item) =>
          item.productId === parseInt(selectedProductId)
            ? { ...item, quantity: parseInt(selectedQuantity) }
            : item
        ),
      });
    } else {
      // Thêm mới
      setFormData({
        ...formData,
        comboItems: [
          ...formData.comboItems,
          {
            productId: parseInt(selectedProductId),
            productName: product.name,
            quantity: parseInt(selectedQuantity),
          },
        ],
      });
    }
    setSelectedProductId("");
    setSelectedQuantity(1);
  };

  const handleRemoveProduct = (productId) => {
    setFormData({
      ...formData,
      comboItems: formData.comboItems.filter(
        (item) => item.productId !== productId
      ),
    });
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    setFormData({
      ...formData,
      comboItems: formData.comboItems.map((item) =>
        item.productId === productId
          ? { ...item, quantity: parseInt(newQuantity) }
          : item
      ),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId || !formData.price) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }
    if (formData.comboItems.length === 0) {
      alert("Vui lòng thêm ít nhất một sản phẩm vào combo!");
      return;
    }

    try {
      let imageUrl = formData.image;

      if (imageFile) {
        setUploading(true);
        const uploadResult = await uploadService.uploadComboImage(imageFile);
        if (uploadResult.success) {
          imageUrl = uploadResult.data.url;
        } else {
          alert("Upload ảnh thất bại: " + uploadResult.message);
          setUploading(false);
          return;
        }
      }

      onSave({ ...formData, image: imageUrl, id: combo?.id });
      onClose();
    } catch (error) {
      console.error("Error saving combo:", error);
      alert("Có lỗi xảy ra khi lưu combo");
    } finally {
      setUploading(false);
    }
  };

  // Lấy danh sách sản phẩm chưa được thêm vào combo
  const availableProducts = products?.filter(
    (p) => !formData.comboItems.find((item) => item.productId === p.id)
  ) || [];

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto z-50 p-6">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-bold text-gray-900">
              {combo ? "Chỉnh sửa combo" : "Thêm combo mới"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên combo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Chọn danh mục</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá combo (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min="0"
                placeholder="199000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hình ảnh
              </label>
              <div className="flex items-center gap-4">
                <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Upload className="text-gray-400" size={24} />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                    "
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả
              </label>
              <textarea
                value={formData.desc}
                onChange={(e) =>
                  setFormData({ ...formData, desc: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập mô tả combo..."
              />
            </div>

            {/* Combo Items Management */}
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Sản phẩm trong combo <span className="text-red-500">*</span>
              </label>

              {/* Add Product Section */}
              <div className="flex gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Chọn sản phẩm</option>
                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(product.price)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="SL"
                />
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus size={18} />
                  Thêm
                </button>
              </div>

              {/* Combo Items List */}
              {formData.comboItems.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {formData.comboItems.map((item) => {
                    const product = products?.find((p) => p.id === item.productId);
                    return (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {product?.image ? (
                            <img
                              src={product.image}
                              alt={item.productName}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <ImageIcon size={20} className="text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {item.productName}
                            </p>
                            {product && (
                              <p className="text-sm text-gray-500">
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(product.price)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(
                                item.productId,
                                e.target.value
                              )
                            }
                            className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(item.productId)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                  Chưa có sản phẩm nào. Hãy thêm sản phẩm vào combo.
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
              </Dialog.Close>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    Đang xử lý...
                  </span>
                ) : combo ? (
                  "Cập nhật"
                ) : (
                  "Thêm mới"
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
