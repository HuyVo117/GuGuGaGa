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

  const driver = await prisma.driver.findUnique({ where: { email } });
  if (!driver) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isValid = await bcrypt.compare(password, driver.password);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken({ id: driver.id, role: "DRIVER", email: driver.email });
  return res.json({ token, user: { id: driver.id, role: "DRIVER", email: driver.email } });
});

router.get("/orders", requireAuth(["DRIVER"]), async (req, res) => {
  const items = await prisma.order.findMany({
    where: { driverId: req.user.id },
    include: {
      user: { select: { id: true, email: true } },
      branch: true,
      orderItems: { include: { product: true, combo: true } },
      bill: true,
    },
    orderBy: { id: "desc" },
  });
  return res.json({ items });
});

router.patch("/orders/:id/status", requireAuth(["DRIVER"]), async (req, res) => {
  const { id } = req.params;
  const { statusOrder = "DELIVERING" } = req.body || {};

  const order = await prisma.order.findFirst({
    where: { id: Number(id), driverId: req.user.id },
  });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const item = await prisma.order.update({
    where: { id: Number(id) },
    data: { statusOrder },
  });
  return res.json(item);
});

router.post("/location", requireAuth(["DRIVER"]), async (req, res) => {
  const { lat, lng } = req.body || {};
  if (typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ message: "lat and lng must be numbers" });
  }

  await prisma.driver.update({
    where: { id: req.user.id },
    data: { lastLat: lat, lastLng: lng },
  });

  return res.json({ ok: true, lat, lng });
});

export default router;