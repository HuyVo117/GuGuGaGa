import db from "../configs/firestore.js";
import bcrypt from "bcrypt";

const usersRef = db.collection("users");

export const userService = {
  async getAllUsers(currentUserId) {
    const snap = await usersRef.get();
    return snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((user) => user.id !== currentUserId);
  },

  async getUserById(id) {
    const doc = await usersRef.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async createUser(data) {
    const now = new Date();
    const docRef = await usersRef.add({
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return { id: docRef.id, ...data, createdAt: now, updatedAt: now };
  },

  async deleteUser(id) {
    await usersRef.doc(id).delete();
    return { id };
  },

  updateUser: async (id, data) => {
    const updateData = {
      updatedAt: new Date(),
    };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.role !== undefined) updateData.role = data.role;

    // Nếu frontend gửi password mới, hash nó
    if (data.password && data.password.trim() !== "") {
      const hashed = await bcrypt.hash(data.password, 10);
      updateData.passwordHash = hashed;
    }

    const docRef = usersRef.doc(id);
    await docRef.update(updateData);
    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() };
  },
};
