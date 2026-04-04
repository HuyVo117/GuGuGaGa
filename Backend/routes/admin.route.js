import express from "express";
import bcrypt from "bcryptjs";
import { requireAuth, signToken } from "../lib/auth.js";
import prisma from "../lib/prisma.js";

const router = express.Router();

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const admin = await prisma.user.findFirst({
    where: { email, role: "ADMIN" },
  });

  if (!admin) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isValid = await bcrypt.compare(password, admin.password);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken({ id: admin.id, role: admin.role, email: admin.email });
  return res.json({
    token,
    user: { id: admin.id, role: admin.role, email: admin.email },
  });
});

router.get("/auth/me", requireAuth(["ADMIN"]), async (req, res) => {
  const admin = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }
  return res.json({ user: { id: admin.id, email: admin.email, role: admin.role } });
});

router.get("/categories", requireAuth(["ADMIN"]), async (req, res) => {
  const items = await prisma.category.findMany({ orderBy: { id: "desc" } });
  return res.json({ items });
});

router.post("/categories", requireAuth(["ADMIN"]), async (req, res) => {
  const { name } = req.body || {};
  if (!name) {
    return res.status(400).json({ message: "name is required" });
  }
  const item = await prisma.category.create({ data: { name } });
  return res.status(201).json(item);
});

router.get("/products", requireAuth(["ADMIN"]), async (req, res) => {
  const items = await prisma.product.findMany({
    include: { category: true },
    orderBy: { id: "desc" },
  });
  return res.json({ items });
});

router.post("/products", requireAuth(["ADMIN"]), async (req, res) => {
  const { name, price, categoryId } = req.body || {};
  if (!name || typeof price !== "number" || !categoryId) {
    return res.status(400).json({ message: "name, price, categoryId are required" });
  }

  const item = await prisma.product.create({
    data: { name, price, categoryId: Number(categoryId) },
    include: { category: true },
  });
  return res.status(201).json(item);
});

router.put("/products/:id", requireAuth(["ADMIN"]), async (req, res) => {
  const id = Number(req.params.id);
  const { name, price, categoryId } = req.body || {};

  const item = await prisma.product.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(typeof price === "number" ? { price } : {}),
      ...(categoryId ? { categoryId: Number(categoryId) } : {}),
    },
    include: { category: true },
  });

  return res.json(item);
});

router.delete("/products/:id", requireAuth(["ADMIN"]), async (req, res) => {
  const id = Number(req.params.id);
  await prisma.product.delete({ where: { id } });
  return res.status(204).send();
});

router.get("/orders", requireAuth(["ADMIN"]), async (req, res) => {
  const items = await prisma.order.findMany({
    include: {
      user: { select: { id: true, email: true } },
      branch: true,
      driver: { select: { id: true, email: true, statusDriver: true } },
      orderItems: {
        include: { product: true, combo: true },
      },
      bill: true,
    },
    orderBy: { id: "desc" },
  });
  return res.json({ items });
});

router.patch("/orders/:id/status", requireAuth(["ADMIN"]), async (req, res) => {
  const id = Number(req.params.id);
  const { statusOrder, driverId } = req.body || {};

  const item = await prisma.order.update({
    where: { id },
    data: {
      ...(statusOrder ? { statusOrder } : {}),
      ...(driverId ? { driverId: Number(driverId) } : {}),
    },
  });

  return res.json(item);
});

router.get("/users", requireAuth(["ADMIN"]), async (req, res) => {
  const items = await prisma.user.findMany({
    select: { id: true, email: true, role: true, createdAt: true },
    orderBy: { id: "desc" },
  });
  return res.json({ items });
});

router.get("/branches", requireAuth(["ADMIN"]), async (req, res) => {
  const items = await prisma.branch.findMany({ orderBy: { id: "desc" } });
  return res.json({ items });
});

router.get("/drivers", requireAuth(["ADMIN"]), async (req, res) => {
  const items = await prisma.driver.findMany({
    select: { id: true, email: true, statusDriver: true, createdAt: true },
    orderBy: { id: "desc" },
  });
  return res.json({ items });
});

export default router;