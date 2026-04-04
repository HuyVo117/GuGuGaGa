import express from "express";
import { requireAuth, signToken } from "../server.js";

const router = express.Router();

router.post("/auth/register", (req, res) => {
  const { email = "user@example.com" } = req.body || {};
  const token = signToken({ id: 100, role: "USER", email });
  res.status(201).json({ token, user: { id: 100, role: "USER", email } });
});

router.post("/auth/login", (req, res) => {
  const { email = "user@example.com" } = req.body || {};
  const token = signToken({ id: 100, role: "USER", email });
  res.json({ token, user: { id: 100, role: "USER", email } });
});

router.get("/cart", requireAuth(["USER"]), (req, res) => {
  res.json({ id: 1, items: [] });
});

router.post("/cart/items", requireAuth(["USER"]), (req, res) => {
  res.status(201).json({ message: "Cart item added" });
});

router.post("/orders", requireAuth(["USER"]), (req, res) => {
  res.status(201).json({ id: 999, statusOrder: "PENDING" });
});

router.get("/orders", requireAuth(["USER"]), (req, res) => {
  res.json({ items: [] });
});

export default router;