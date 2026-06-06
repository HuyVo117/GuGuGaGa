import db from "../configs/firestore.js";

const categoriesRef = db.collection("categories");

export const categoryService = {
  async getAllCategories() {
    const snap = await categoriesRef.get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  async createCategory(name) {
    const docRef = await categoriesRef.add({ name });
    return { id: docRef.id, name };
  },

  async updateCategory(id, name) {
    const docRef = categoriesRef.doc(id);
    await docRef.update({ name });
    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() };
  },

  async deleteCategory(id) {
    await categoriesRef.doc(id).delete();
    return { id };
  },
};
