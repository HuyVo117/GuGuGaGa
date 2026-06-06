import db from "../configs/firestore.js";

const branchesRef = db.collection("branches");

export const branchService = {
  async getAll() {
    const snap = await branchesRef.orderBy("createdAt", "desc").get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  async create(data) {
    const now = new Date();
    const docRef = await branchesRef.add({
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return { id: docRef.id, ...data, createdAt: now, updatedAt: now };
  },

  async update(id, data) {
    const docRef = branchesRef.doc(id);
    await docRef.update({ ...data, updatedAt: new Date() });
    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() };
  },

  async delete(id) {
    await branchesRef.doc(id).delete();
    return { id };
  },
};
