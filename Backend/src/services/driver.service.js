import db from "../configs/firestore.js";
import bcrypt from "bcrypt";

const driversRef = db.collection("drivers");
const branchesRef = db.collection("branches");

// Helper: populate branch
async function populateBranch(driver) {
  if (driver.branchId) {
    const branchDoc = await branchesRef.doc(driver.branchId).get();
    driver.branch = branchDoc.exists ? { id: branchDoc.id, ...branchDoc.data() } : null;
  } else {
    driver.branch = null;
  }
  return driver;
}

export const driverService = {
  // Lấy danh sách
  async getAll() {
    const snap = await driversRef.orderBy("createdAt", "desc").get();
    const drivers = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    await Promise.all(drivers.map(populateBranch));
    return drivers;
  },

  // Lấy 1 tài xế
  async getById(id) {
    const doc = await driversRef.doc(id).get();
    if (!doc.exists) throw new Error("Không tìm thấy tài xế");
    const driver = { id: doc.id, ...doc.data() };
    await populateBranch(driver);
    return driver;
  },

  // Tạo tài xế
  async create(data) {
    const hashed = await bcrypt.hash(data.password, 10);
    const now = new Date();
    const docRef = await driversRef.add({
      branchId: data.branchId,
      name: data.name,
      phone: data.phone,
      passwordHash: hashed,
      status: "AVAILABLE",
      latitude: null,
      longitude: null,
      createdAt: now,
      updatedAt: now,
    });
    return { id: docRef.id, branchId: data.branchId, name: data.name, phone: data.phone, status: "AVAILABLE", createdAt: now, updatedAt: now };
  },

  // Cập nhật tài xế
  async update(id, data) {
    const updateData = {
      updatedAt: new Date(),
    };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.branchId !== undefined) updateData.branchId = data.branchId;
    if (data.status !== undefined) updateData.status = data.status;

    // Nếu có password → hash lại
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const docRef = driversRef.doc(id);
    await docRef.update(updateData);
    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() };
  },

  // Xóa tài xế
  async remove(id) {
    await driversRef.doc(id).delete();
    return { id };
  },
};
