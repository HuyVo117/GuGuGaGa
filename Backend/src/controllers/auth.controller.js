import { ApiResponse } from "../configs/apiResponse.js";
import { authService } from "../services/auth.service.js";

export const userAuthController = {
	async signUp(req, res) {
		try {
			const { email, password } = req.body;

			if (!email || !password) {
				return ApiResponse.error(res, new Error("Vui long dien day du"), 400);
			}

			const result = await authService.signUp(email, password, "USER");
			return ApiResponse.success(res, result, "Dang ky thanh cong", 201);
		} catch (err) {
			return ApiResponse.error(res, err, 400);
		}
	},

	async signIn(req, res) {
		try {
			const { email, password } = req.body;

			if (!email || !password) {
				return ApiResponse.error(res, new Error("All fields are required"), 400);
			}

			const result = await authService.signIn(email, password);
			return ApiResponse.success(res, result, "Dang nhap thanh cong");
		} catch (err) {
			return ApiResponse.error(res, err, 400);
		}
	},

	async signOut(req, res) {
		try {
			res.clearCookie("jwt", {
				httpOnly: true,
				sameSite: "strict",
				secure: process.env.NODE_ENV === "production",
			});

			return ApiResponse.success(res, null, "Dang xuat thanh cong");
		} catch (err) {
			return ApiResponse.error(res, err, 500);
		}
	},

	async getMe(req, res) {
		try {
			if (!req.user) {
				return ApiResponse.error(res, new Error("Unauthorized"), 401);
			}
			const user = {
				id: req.user.id,
				role: req.user.role,
				email: req.user.email,
			};
			return ApiResponse.success(res, { user }, "User info", 200);
		} catch (err) {
			return ApiResponse.error(res, err, 500);
		}
	},

	async updateProfile(req, res) {
		try {
			const userId = req.user.id;
			const updateData = req.body;
			const updatedUser = await authService.updateProfile(userId, updateData);
			return ApiResponse.success(res, updatedUser, "Profile updated successfully");
		} catch (err) {
			return ApiResponse.error(res, err, 400);
		}
	},
};
