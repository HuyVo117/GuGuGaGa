import jwt from "jsonwebtoken";
import { config } from "../configs/env.js";
import prisma from "../configs/prisma.js";

/**
 * Middleware xac thuc JWT cho Driver.
 * Neu hop le -> gan req.user = driver.
 */
export const protectDriverRoute = async (req, res, next) => {
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

		const driver = await prisma.driver.findUnique({
			where: { id: decoded.id || decoded.userId },
		});

		if (!driver) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized: Driver not found",
			});
		}

		req.user = driver;
		next();
	} catch {
		return res.status(401).json({
			success: false,
			message: "Invalid or expired token",
		});
	}
};
