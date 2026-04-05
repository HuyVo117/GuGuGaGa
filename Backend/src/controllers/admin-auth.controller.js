import { ApiResponse } from "../configs/apiResponse.js";
import { authService } from "../services/auth.service.js";

export const adminAuthController = {
	async signIn(req, res) {
		try {
			const { email, password } = req.body;

			if (!email || !password) {
				return ApiResponse.error(res, new Error("All fields are required"), 400);
			}

			const result = await authService.signIn(email, password);

			if (result.user.role !== "ADMIN") {
				return ApiResponse.error(res, new Error("Ban khong co quyen truy cap"), 403);
			}

			res.cookie("jwt", result.token, {
				maxAge: 7 * 24 * 60 * 60 * 1000,
				httpOnly: true,
				sameSite: "strict",
				secure: process.env.NODE_ENV === "production",
			});

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
				email: req.user.email,
				role: req.user.role,
			};

			return ApiResponse.success(res, { user }, "User info", 200);
		} catch (err) {
			return ApiResponse.error(res, err, 500);
		}
	},
};
