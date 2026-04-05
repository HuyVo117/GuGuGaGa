import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ApiResponse } from "../configs/apiResponse.js";
import { config } from "../configs/env.js";
import prisma from "../configs/prisma.js";

export const shipperController = {
	async login(req, res) {
		try {
			const { email, password } = req.body || {};
			if (!email || !password) {
				return ApiResponse.error(res, new Error("Email and password are required"), 400);
			}

			const driver = await prisma.driver.findUnique({ where: { email } });
			if (!driver) {
				return ApiResponse.error(res, new Error("Invalid credentials"), 401);
			}

			const isValid = await bcrypt.compare(password, driver.password);
			if (!isValid) {
				return ApiResponse.error(res, new Error("Invalid credentials"), 401);
			}

			const token = jwt.sign(
				{ id: driver.id, userId: driver.id, role: "DRIVER", email: driver.email },
				config.jwtSecret,
				{ expiresIn: "7d" }
			);

			return ApiResponse.success(
				res,
				{ token, user: { id: driver.id, role: "DRIVER", email: driver.email } },
				"Dang nhap thanh cong"
			);
		} catch (error) {
			return ApiResponse.error(res, error, 400);
		}
	},

	async getAvailableOrders(req, res) {
		try {
			const items = await prisma.order.findMany({
				where: { driverId: null, statusOrder: { in: ["PENDING", "CONFIRMED"] } },
				include: {
					user: { select: { id: true, email: true } },
					branch: true,
					orderItems: { include: { product: true, combo: true } },
					bill: true,
				},
				orderBy: { id: "desc" },
			});

			return ApiResponse.success(res, { items }, "Lay don san sang thanh cong");
		} catch (error) {
			return ApiResponse.error(res, error, 400);
		}
	},

	async acceptOrder(req, res) {
		try {
			const id = Number(req.params.id);
			const order = await prisma.order.findUnique({ where: { id } });
			if (!order) {
				return ApiResponse.error(res, new Error("Order not found"), 404);
			}

			if (order.driverId && order.driverId !== req.user.id) {
				return ApiResponse.error(
					res,
					new Error("Order already accepted by another driver"),
					409
				);
			}

			const item = await prisma.order.update({
				where: { id },
				data: {
					driverId: req.user.id,
					statusOrder: order.statusOrder === "PENDING" ? "CONFIRMED" : order.statusOrder,
				},
			});

			return ApiResponse.success(res, item, "Nhan don thanh cong");
		} catch (error) {
			return ApiResponse.error(res, error, 400);
		}
	},

	async getMyOrders(req, res) {
		try {
			const items = await prisma.order.findMany({
				where: { driverId: req.user.id },
				include: {
					user: { select: { id: true, email: true } },
					branch: true,
					orderItems: { include: { product: true, combo: true } },
					bill: true,
				},
				orderBy: { id: "desc" },
			});

			return ApiResponse.success(res, { items }, "Lay danh sach don cua tai xe thanh cong");
		} catch (error) {
			return ApiResponse.error(res, error, 400);
		}
	},

	async updateOrderStatus(req, res) {
		try {
			const id = Number(req.params.id);
			const { statusOrder = "DELIVERING" } = req.body || {};

			const order = await prisma.order.findFirst({
				where: { id, driverId: req.user.id },
			});

			if (!order) {
				return ApiResponse.error(res, new Error("Order not found"), 404);
			}

			const item = await prisma.order.update({
				where: { id },
				data: { statusOrder },
			});

			return ApiResponse.success(res, item, "Cap nhat trang thai thanh cong");
		} catch (error) {
			return ApiResponse.error(res, error, 400);
		}
	},

	async updateLocation(req, res) {
		try {
			const { lat, lng } = req.body || {};
			if (typeof lat !== "number" || typeof lng !== "number") {
				return ApiResponse.error(res, new Error("lat and lng must be numbers"), 400);
			}

			await prisma.driver.update({
				where: { id: req.user.id },
				data: { lastLat: lat, lastLng: lng },
			});

			return ApiResponse.success(res, { ok: true, lat, lng }, "Cap nhat vi tri thanh cong");
		} catch (error) {
			return ApiResponse.error(res, error, 400);
		}
	},
};
