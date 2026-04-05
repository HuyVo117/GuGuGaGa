import prisma from "../configs/prisma.js";

export const cartService = {
	async getCart(userId) {
		return prisma.cart.findFirst({
			where: { userId },
			include: {
				cartItems: {
					include: {
						product: true,
					},
				},
			},
		});
	},

	async getOrCreateCart(userId) {
		let cart = await this.getCart(userId);
		if (!cart) {
			cart = await prisma.cart.create({
				data: { userId },
				include: {
					cartItems: {
						include: {
							product: true,
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
			return prisma.cartItem.update({
				where: { id: existingItem.id },
				data: { quantity: existingItem.quantity + Number(quantity) },
			});
		}

		return prisma.cartItem.create({
			data: { cartId: cart.id, productId: Number(productId), quantity: Number(quantity) },
		});
	},

	async updateItemQuantity(userId, itemId, quantity) {
		const cart = await this.getOrCreateCart(userId);
		const item = await prisma.cartItem.findFirst({
			where: { id: Number(itemId), cartId: cart.id },
		});
		if (!item) {
			throw new Error("Cart item not found");
		}

		return prisma.cartItem.update({
			where: { id: item.id },
			data: { quantity: Number(quantity) },
		});
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
		return { removed: true };
	},
};
