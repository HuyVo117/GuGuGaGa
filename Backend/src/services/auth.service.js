import db from "../configs/firestore.js";
import { config } from "../configs/env.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const usersRef = db.collection("users");

export const authService = {
  async signUp(name, phone, email, password) {
    // 1. Kiểm tra email đã tồn tại chưa
    const emailSnap = await usersRef.where("email", "==", email).limit(1).get();
    if (!emailSnap.empty) {
      throw new Error("Email đã được đăng ký");
    }

    // 2. Kiểm tra phone đã tồn tại chưa
    const phoneSnap = await usersRef.where("phone", "==", phone).limit(1).get();
    if (!phoneSnap.empty) {
      throw new Error("Số điện thoại đã được đăng ký");
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Tạo user mới
    const now = new Date();
    const docRef = await usersRef.add({
      name,
      phone,
      email,
      passwordHash,
      role: "CUSTOMER",
      address: null,
      createdAt: now,
      updatedAt: now,
    });

    const newUser = { id: docRef.id, name, phone, email, role: "CUSTOMER", createdAt: now, updatedAt: now };

    // 5. Tạo token
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role },
      config.jwtSecret,
      { expiresIn: "1d" }
    );

    // 6. Trả về controller
    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
      token,
    };
  },

  async signIn(phone, password) {
    // 1. Tìm user theo phone
    const snap = await usersRef.where("phone", "==", phone).limit(1).get();

    // 2. Nếu không có user → báo lỗi
    if (snap.empty) {
      throw new Error("Số điện thoại không tồn tại");
    }

    const doc = snap.docs[0];
    const user = { id: doc.id, ...doc.data() };

    // 3. Kiểm tra mật khẩu
    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) {
      throw new Error("Sai mật khẩu");
    }

    // 4. Tạo token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: "1d" }
    );

    // 5. Trả dữ liệu về controller
    return {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };
  },

  async updateProfile(userId, data) {
    const userRef = usersRef.doc(userId);
    await userRef.update({
      name: data.name,
      address: data.address,
      email: data.email,
      updatedAt: new Date(),
    });
    const updated = await userRef.get();
    return { id: updated.id, ...updated.data() };
  },
};
