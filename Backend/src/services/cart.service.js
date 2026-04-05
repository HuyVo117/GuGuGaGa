import prisma from "../configs/prisma.js";

export const cartService = {
	async getCart(userId) {
		return prisma.cart.findFirst({
			where: { userId },
			include: {
				cartItem: {
					include: {
						product: true,
						combo: true,
					},
				},
			},
		});
	},

	async getOrCreateCart(userId) {
		let cart = await this.getCart(userId);
		if (!cart) {
			const firstBranch = await prisma.branch.findFirst({ orderBy: { id: "asc" } });
			if (!firstBranch) {
				throw new Error("Chua co chi nhanh de tao gio hang");
			}

			cart = await prisma.cart.create({
				data: { userId, branchId: firstBranch.id, totalAmount: 0 },
				include: {
					cartItem: {
						include: {
							product: true,
							combo: true,
						},
					},
				},
			});
		}
		return cart;
	},

	async addItem(userId, productId, quantity = 1) {
		const cart = await this.getOrCreateCart(userId);

		const existingItem = await prisma.cartItem.findFirst({
			where: { cartId: cart.id, productId: Number(productId) },
		});

		if (existingItem) {
			const updated = await prisma.cartItem.update({
				where: { id: existingItem.id },
				data: { quantity: existingItem.quantity + Number(quantity) },
			});

			await this.recalculateTotal(cart.id);
			return updated;
		}

		const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
		if (!product) {
			throw new Error("Product not found");
		}

		const created = await prisma.cartItem.create({
			data: {
				cartId: cart.id,
				productId: Number(productId),
				quantity: Number(quantity),
				price: Number(product.price),
			},
		});

		await this.recalculateTotal(cart.id);
		return created;
	},

	async updateItemQuantity(userId, itemId, quantity) {
		const cart = await this.getOrCreateCart(userId);
		const item = await prisma.cartItem.findFirst({
			where: { id: Number(itemId), cartId: cart.id },
		});
		if (!item) {
			throw new Error("Cart item not found");
		}

		const updated = await prisma.cartItem.update({
			where: { id: item.id },
			data: { quantity: Number(quantity) },
		});

		await this.recalculateTotal(cart.id);
		return updated;
	},

	async removeItem(userId, itemId) {
		const cart = await this.getOrCreateCart(userId);
		const item = await prisma.cartItem.findFirst({
			where: { id: Number(itemId), cartId: cart.id },
		});
		if (!item) {
			throw new Error("Cart item not found");
		}

		await prisma.cartItem.delete({
			where: { id: item.id },
		});
		await this.recalculateTotal(cart.id);
		return { removed: true };
	},

	async recalculateTotal(cartId) {
		const items = await prisma.cartItem.findMany({
			where: { cartId },
			include: { product: true, combo: true },
		});

		const totalAmount = items.reduce((sum, item) => {
			const basePrice = item.product?.price ?? item.combo?.price ?? item.price ?? 0;
			return sum + Number(basePrice) * Number(item.quantity);
		}, 0);

		await prisma.cart.update({
			where: { id: cartId },
			data: { totalAmount },
		});
	},
};
