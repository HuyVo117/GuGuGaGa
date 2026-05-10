import db from "../configs/firestore.js";
import { deleteImageService } from "./upload.service.js";

const productsRef = db.collection("products");
const categoriesRef = db.collection("categories");

const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
};

// Helper: populate category data into a product
async function populateCategory(product) {
  if (product.categoryId) {
    const catDoc = await categoriesRef.doc(product.categoryId).get();
    product.category = catDoc.exists ? { id: catDoc.id, ...catDoc.data() } : null;
  } else {
    product.category = null;
  }
  return product;
}

export const productService = {
  // Lấy tất cả sản phẩm, có thể filter theo category
  async getAll(categoryId) {
    let query = productsRef.orderBy("createdAt", "desc");
    if (categoryId) {
      query = productsRef.where("categoryId", "==", categoryId).orderBy("createdAt", "desc");
    }
    const snap = await query.get();
    const products = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Populate category for each product
    await Promise.all(products.map(populateCategory));
    return products;
  },

  // Lấy sản phẩm theo id
  async getById(id) {
    const doc = await productsRef.doc(id).get();
    if (!doc.exists) throw new Error("Product not found");
    const product = { id: doc.id, ...doc.data() };
    await populateCategory(product);
    return product;
  },

  // Tạo sản phẩm mới
  async create({ name, price, categoryId, desc, image }) {
    // Kiểm tra category tồn tại
    const catDoc = await categoriesRef.doc(categoryId).get();
    if (!catDoc.exists) throw new Error("Category not found");

    const now = new Date();
    const docRef = await productsRef.add({
      name,
      price: Number(price),
      categoryId,
      desc: desc || null,
      image: image || null,
      createdAt: now,
      updatedAt: now,
    });
    return { id: docRef.id, name, price: Number(price), categoryId, desc, image, createdAt: now, updatedAt: now };
  },

  // Cập nhật sản phẩm
  async update(id, { name, price, categoryId, desc, image }) {
    const docRef = productsRef.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) throw new Error("Product not found");
    const product = doc.data();

    if (categoryId) {
      const catDoc = await categoriesRef.doc(categoryId).get();
      if (!catDoc.exists) throw new Error("Category not found");
    }

    if (image && product.image && image !== product.image) {
      const publicId = getPublicIdFromUrl(product.image);
      if (publicId) {
        await deleteImageService(publicId);
      }
    }

    const updateData = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = Number(price);
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (desc !== undefined) updateData.desc = desc;
    if (image !== undefined) updateData.image = image;

    await docRef.update(updateData);
    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() };
  },

  // Xoá sản phẩm
  async delete(id) {
    const docRef = productsRef.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) throw new Error("Product not found");
    const product = doc.data();

    if (product.image) {
      const publicId = getPublicIdFromUrl(product.image);
      if (publicId) {
        await deleteImageService(publicId);
      }
    }

    await docRef.delete();
    return { message: "Product deleted successfully" };
  },
};
