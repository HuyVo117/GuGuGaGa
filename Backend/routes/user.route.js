import express from "express";
import bcrypt from "bcryptjs";
import { requireAuth, signToken } from "../lib/auth.js";
import prisma from "../lib/prisma.js";

const router = express.Router();

router.post("/auth/register", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const existed = await prisma.user.findUnique({ where: { email } });
  if (existed) {
    return res.status(409).json({ message: "Email already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashed, role: "USER" },
  });

  const token = signToken({ id: user.id, role: user.role, email: user.email });
  return res.status(201).json({
    token,
    user: { id: user.id, role: user.role, email: user.email },
  });
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await prisma.user.findFirst({ where: { email, role: "USER" } });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken({ id: user.id, role: user.role, email: user.email });
  return res.json({ token, user: { id: user.id, role: user.role, email: user.email } });
});

router.get("/cart", requireAuth(["USER"]), async (req, res) => {
  let cart = await prisma.cart.findFirst({
    where: { userId: req.user.id },
    include: { cartItems: { include: { product: true } } },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: req.user.id },
      include: { cartItems: { include: { product: true } } },
    });
  }

  return res.json(cart);
});

router.post("/cart/items", requireAuth(["USER"]), async (req, res) => {
  const { productId, quantity = 1 } = req.body || {};
  if (!productId) {
    return res.status(400).json({ message: "productId is required" });
  }

  let cart = await prisma.cart.findFirst({ where: { userId: req.user.id } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: req.user.id } });
  }

  const existingItem = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId: Number(productId) },
  });

  if (existingItem) {
    const item = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + Number(quantity) },
    });
    return res.json(item);
  }

  const item = await prisma.cartItem.create({
    data: { cartId: cart.id, productId: Number(productId), quantity: Number(quantity) },
  });
  return res.status(201).json(item);
});

router.post("/orders", requireAuth(["USER"]), async (req, res) => {
  const { branchId, paymentMethod = "COD", items } = req.body || {};
  if (!branchId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "branchId and items are required" });
  }

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        userId: req.user.id,
        branchId: Number(branchId),
        paymentMethod,
      },
    });

    let total = 0;
    for (const item of items) {
      const quantity = Number(item.quantity || 1);
      let price = 0;

      if (item.productId) {
        const product = await tx.product.findUnique({ where: { id: Number(item.productId) } });
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }
        price = product.price;
      } else if (item.comboId) {
        const combo = await tx.combo.findUnique({ where: { id: Number(item.comboId) } });
        if (!combo) {
          throw new Error(`Combo ${item.comboId} not found`);
        }
        price = combo.price;
      } else {
        throw new Error("Each item needs productId or comboId");
      }

      total += price * quantity;

      await tx.orderItem.create({
        data: {
          orderId: createdOrder.id,
          productId: item.productId ? Number(item.productId) : null,
          comboId: item.comboId ? Number(item.comboId) : null,
          quantity,
          price,
        },
      });
    }

    await tx.bill.create({
      data: {
        orderId: createdOrder.id,
        total,
      },
    });

    return tx.order.findUnique({
      where: { id: createdOrder.id },
      include: {
        orderItems: { include: { product: true, combo: true } },
        bill: true,
      },
    });
  });

  return res.status(201).json(order);
});

router.get("/orders", requireAuth(["USER"]), async (req, res) => {
  const items = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: {
      branch: true,
      driver: { select: { id: true, email: true, statusDriver: true } },
      orderItems: { include: { product: true, combo: true } },
      bill: true,
    },
    orderBy: { id: "desc" },
  });
  return res.json({ items });
});

export default router;