import prisma from "../configs/prisma.js";

export const orderService = {
	async getAll() {
		return prisma.order.findMany({
			include: {
				orderItem: {
					include: {
						product: { include: { category: true } },
						combo: true,
					},
				},
				user: true,
				branch: true,
				driver: true,
			},
			orderBy: { id: "desc" },
		});
	},

	async createOrder(userId, cart, body) {
		const { paymentMethod = "COD" } = body;

		// Demo fallback branch: use branch id 1 if cart has no branch context.
		const branchId = 1;

		const productIds = cart.cartItem.map((item) => item.productId).filter(Boolean);
		const products = await prisma.product.findMany({
			where: { id: { in: productIds } },
		});
		const productMap = new Map(products.map((p) => [p.id, p]));

		const items = cart.cartItem.map((item) => {
			if (item.productId) {
				const product = productMap.get(item.productId);
				if (!product) {
					throw new Error(`Product ${item.productId} not found`);
				}
				return {
					productId: item.productId,
					quantity: item.quantity,
					price: item.price,
				};
			}

			if (item.comboId) {
				return {
					comboId: item.comboId,
					quantity: item.quantity,
					price: item.price,
				};
			}

			throw new Error("Cart item khong hop le");
		});

		const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

		const order = await prisma.$transaction(async (tx) => {
			const user = await tx.user.findUnique({ where: { id: userId } });
			if (!user) {
				throw new Error("User khong ton tai");
			}

			const created = await tx.order.create({
				data: {
					userId,
					branchId,
					totalAmount,
					status: "PENDING",
					paymentMethod,
					deliveryAddress: user.address || "Chua cap nhat dia chi",
					deliveryPhone: user.phone,
					orderItem: {
						create: items,
					},
				},
				include: {
					orderItem: true,
				},
			});

			await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
			await tx.cart.update({ where: { id: cart.id }, data: { totalAmount: 0 } });

			return tx.order.findUnique({
				where: { id: created.id },
				include: {
					orderItem: { include: { product: true, combo: true } },
					branch: true,
				},
			});
		});

		return order;
	},

	async getOrdersByUser(userId) {
		return prisma.order.findMany({
			where: { userId },
			include: {
				orderItem: {
					include: {
						product: { include: { category: true } },
						combo: true,
					},
				},
				branch: true,
				driver: true,
			},
			orderBy: { id: "desc" },
		});
	},

	async getOrderDetail(orderId, userId) {
		return prisma.order.findFirst({
			where: { id: orderId, userId },
			include: {
				orderItem: {
					include: {
						product: { include: { category: true } },
						combo: true,
					},
				},
				branch: true,
				driver: true,
			},
		});
	},

	async getAdminOrderDetail(orderId) {
		return prisma.order.findUnique({
			where: { id: orderId },
			include: {
				orderItem: {
					include: {
						product: { include: { category: true } },
						combo: true,
					},
				},
				branch: true,
				user: true,
				driver: true,
			},
		});
	},

	async updateStatus(orderId, status) {
		const validStatuses = ["PENDING", "ACCEPTED", "DRIVER_ASSIGNED", "DELIVERED", "CANCELLED"];
		if (!validStatuses.includes(status)) {
			throw new Error(`Status khong hop le. Chi chap nhan: ${validStatuses.join(", ")}`);
		}

		if (status === "DELIVERED") {
			const currentOrder = await prisma.order.findUnique({
				where: { id: Number(orderId) },
			});
			if (currentOrder?.driverId) {
				await prisma.driver.update({
					where: { id: currentOrder.driverId },
					data: { status: "AVAILABLE" },
				});
			}
		}

		return prisma.order.update({
			where: { id: Number(orderId) },
			data: { status },
			include: {
				orderItem: true,
				user: true,
				branch: true,
				driver: true,
			},
		});
	},

	async assignDriver(orderId, driverId) {
		const driver = await prisma.driver.findUnique({
			where: { id: Number(driverId) },
		});
		if (!driver) {
			throw new Error("Driver khong ton tai");
		}

		await prisma.driver.update({
			where: { id: Number(driverId) },
			data: { status: "ON_DELIVERY" },
		});

		return prisma.order.update({
			where: { id: Number(orderId) },
			data: {
				driverId: Number(driverId),
				status: "DRIVER_ASSIGNED",
			},
			include: {
				orderItem: true,
				user: true,
				branch: true,
				driver: true,
			},
		});
	},
};
