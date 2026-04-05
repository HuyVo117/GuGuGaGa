import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../configs/env.js";
import prisma from "../configs/prisma.js";

export const authService = {
	async signUp(email, password, role = "USER") {
		const emailExists = await prisma.user.findUnique({
			where: { email },
		});
		if (emailExists) {
			throw new Error("Email da duoc dang ky");
		}

		const passwordHash = await bcrypt.hash(password, 10);

		const newUser = await prisma.user.create({
			data: {
				email,
				password: passwordHash,
				role,
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
				email: newUser.email,
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

		const isPasswordCorrect = await bcrypt.compare(password, user.password);
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
				email: user.email,
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
				email: data.email,
			},
		});
		return updatedUser;
	},
};
