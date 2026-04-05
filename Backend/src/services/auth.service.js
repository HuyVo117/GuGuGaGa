import prisma from "../configs/prisma.js";
import { config } from "../configs/env.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const authService = {
  async signUp(name, phone, email, password) {
    // 1. Kiểm tra email đã tồn tại chưa
    const emailExists = await prisma.user.findUnique({
      where: { email },
    });
    if (emailExists) {
      throw new Error("Email đã được đăng ký");
    }

    // 2. Kiểm tra phone đã tồn tại chưa
    const phoneExists = await prisma.user.findUnique({
      where: { phone },
    });
    if (phoneExists) {
      throw new Error("Số điện thoại đã được đăng ký");
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Tạo user mới
    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        email,
        passwordHash,
        role: "CUSTOMER",
      },
    });

    // 5. Tạo token
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role },
      config.jwtSecret,
      {
        expiresIn: "1d",
      }
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
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    // 2. Nếu không có user → báo lỗi
    if (!user) {
      throw new Error("Số điện thoại không tồn tại");
    }

    // 3. Kiểm tra mật khẩu
    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) {
      throw new Error("Sai mật khẩu");
    }

    // 4. Tạo token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwtSecret,
      {
        expiresIn: "1d",
      }
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
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        address: data.address,
        email: data.email,
      },
    });
    return updatedUser;
  },
};
