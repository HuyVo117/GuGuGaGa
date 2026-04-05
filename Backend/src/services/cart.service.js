import prisma from "../configs/prisma.js";
export const cartService = {
  // Tạo cart hoặc lấy cart hiện có
  createCart: async (userId, branchId) => {
    let cart = await prisma.cart.findFirst({
      where: { userId, branchId },
      include: {
        cartItem: {
          include: {
            product: { include: { category: true } },
            combo: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId, branchId, totalAmount: 0 },
        include: {
          cartItem: {
            include: {
              product: { include: { category: true } },
              combo: true,
            },
          },
        },
      });
    }

    return cart;
  },

  // Thêm sản phẩm vào cart
  addToCart: async (
    userId,
    branchId,
    productId,
    comboId,
    quantity = 1
  ) => {
    // Lấy cart hiện tại
    let cart = await prisma.cart.findFirst({
      where: { userId, branchId },
      include: {
        cartItem: {
          include: {
            product: { include: { category: true } },
            combo: true,
          },
        },
      },
    });

    if (!cart) throw new Error("Vui lòng chọn chi nhánh trước.");

    let price = 0;

    if (productId) {
      // Lấy thông tin product
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });
      if (!product) throw new Error("Sản phẩm không tồn tại");
      price = product.price;
    } else if (comboId) {
      // Lấy thông tin combo
      const combo = await prisma.combo.findUnique({
        where: { id: comboId },
      });
      if (!combo) throw new Error("Combo không tồn tại");
      price = combo.price;
    } else {
      throw new Error("Phải chọn sản phẩm hoặc combo");
    }

    // Kiểm tra sản phẩm/combo đã có trong cart chưa
    const existingItem = cart.cartItem.find((i) => {
      if (productId) return i.productId === productId;
      if (comboId) return i.comboId === comboId;
      return false;
    });

    if (existingItem) {
      // Cập nhật quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      // Thêm mới cartItem
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: productId || null,
          comboId: comboId || null,
          quantity,
          price: price, // bắt buộc theo schema
        },
      });
    }

    // Recalculate tổng tiền
    return cartService.recalculate(cart.id);
  },

  // Cập nhật quantity sản phẩm
  updateQuantity: async (cartItemId, quantity) => {
    if (quantity <= 0) throw new Error("Số lượng phải lớn hơn 0");

    const item = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: {
        cart: {
          include: {
            cartItem: {
              include: {
                product: { include: { category: true } },
                combo: true,
              },
            },
          },
        },
      },
    });

    return cartService.recalculate(item.cartId);
  },

  // Xóa sản phẩm khỏi cart
  removeItem: async (cartItemId) => {
    const item = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
    });

    if (!item) throw new Error("Sản phẩm không tồn tại trong giỏ hàng");

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return cartService.recalculate(item.cartId);
  },

  // Tính tổng tiền cart
  recalculate: async (cartId) => {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        cartItem: {
          include: {
            product: { include: { category: true } },
            combo: true,
          },
        },
      },
    });

    let total = 0;
    cart.cartItem.forEach((item) => {
      const price = item.product ? item.product.price : (item.combo ? item.combo.price : 0);
      total += item.quantity * price;
    });

    return prisma.cart.update({
      where: { id: cartId },
      data: { totalAmount: total },
      include: {
        cartItem: {
          include: {
            product: { include: { category: true } },
            combo: true,
          },
        },
      },
    });
  },

  // Lấy cart theo branch
  getCart: async (userId, branchId) => {
    const cart = await prisma.cart.findFirst({
      where: { userId, branchId },
      include: {
        cartItem: {
          include: {
            product: { include: { category: true } },
            combo: true,
          },
        },
      },
    });

    if (!cart) return { totalAmount: 0, cartItem: [] };
    return cart;
  },
};
