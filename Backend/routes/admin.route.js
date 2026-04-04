import express from "express";
import { requireAuth, signToken } from "../server.js";

const router = express.Router();

router.post("/auth/login", (req, res) => {
  const { email = "admin@chickengoo.vn" } = req.body || {};
  const token = signToken({ id: 1, role: "ADMIN", email });
  res.json({ token, user: { id: 1, role: "ADMIN", email } });
});

router.get("/auth/me", requireAuth(["ADMIN"]), (req, res) => {
  res.json({ user: req.user });
});

router.get("/categories", requireAuth(["ADMIN"]), (req, res) => {
  res.json({ items: [] });
});

router.get("/products", requireAuth(["ADMIN"]), (req, res) => {
  res.json({ items: [] });
});

router.get("/orders", requireAuth(["ADMIN"]), (req, res) => {
  res.json({ items: [] });
});

router.get("/users", requireAuth(["ADMIN"]), (req, res) => {
  res.json({ items: [] });
});

router.get("/branches", requireAuth(["ADMIN"]), (req, res) => {
  res.json({ items: [] });
});

router.get("/drivers", requireAuth(["ADMIN"]), (req, res) => {
  res.json({ items: [] });
});

export default router;