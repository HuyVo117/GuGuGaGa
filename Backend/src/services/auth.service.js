import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../configs/env.js";
import prisma from "../configs/prisma.js";

export const authService = {
	async signUp(email, password, role = "CUSTOMER", profile = {}) {
		const emailExists = await prisma.user.findUnique({
			where: { email },
		});
		if (emailExists) {
			throw new Error("Email da duoc dang ky");
		}

		const phone = (profile.phone || "").trim();
		if (!phone) {
			throw new Error("Phone la bat buoc");
		}

		const phoneExists = await prisma.user.findUnique({
			where: { phone },
		});
		if (phoneExists) {
			throw new Error("So dien thoai da duoc dang ky");
		}

		const passwordHash = await bcrypt.hash(password, 10);

		const newUser = await prisma.user.create({
			data: {
				name: profile.name || "Customer",
				email,
				phone,
				passwordHash,
				role,
				address: profile.address || null,
			},
		});

		const token = jwt.sign(
			{ userId: newUser.id, role: newUser.role },
			config.jwtSecret,
			{ expiresIn: "1d" }
		);

		return {
			user: {
				id: newUser.id,
				name: newUser.name,
				email: newUser.email,
				phone: newUser.phone,
				role: newUser.role,
				createdAt: newUser.createdAt,
			},
			token,
		};
	},

	async signIn(email, password) {
		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			throw new Error("Email khong ton tai");
		}

		const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
		if (!isPasswordCorrect) {
			throw new Error("Sai mat khau");
		}

		const token = jwt.sign(
			{ userId: user.id, role: user.role },
			config.jwtSecret,
			{ expiresIn: "1d" }
		);

		return {
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				phone: user.phone,
				role: user.role,
				createdAt: user.createdAt,
			},
			token,
		};
	},

	async updateProfile(userId, data) {
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: {
				...(data.name ? { name: data.name } : {}),
				...(data.email ? { email: data.email } : {}),
				...(data.phone ? { phone: data.phone } : {}),
				...(data.address !== undefined ? { address: data.address } : {}),
			},
		});
		return updatedUser;
	},
};
