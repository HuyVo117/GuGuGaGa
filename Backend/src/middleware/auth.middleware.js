import jwt from "jsonwebtoken";
import prisma from "../configs/prisma.js";
import { config } from "../configs/env.js";

/**
 * Middleware xac thuc JWT.
 * Neu hop le -> gan req.user = { id, email, role }.
 */
export const protectRoute = async (req, res, next) => {
	try {
		let token;

		if (req.headers.authorization?.startsWith("Bearer")) {
			token = req.headers.authorization.split(" ")[1];
		}

		if (!token && req.cookies?.jwt) {
			token = req.cookies.jwt;
		}

		if (!token) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized: No token provided",
			});
		}

		const decoded = jwt.verify(token, config.jwtSecret);

		const user = await prisma.user.findUnique({
			where: { id: decoded.userId || decoded.id },
			select: {
				id: true,
				email: true,
				role: true,
			},
		});

		if (!user) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized: User not found",
			});
		}

		req.user = user;
		next();
	} catch {
		return res.status(401).json({
			success: false,
			message: "Invalid or expired token",
		});
	}
};
