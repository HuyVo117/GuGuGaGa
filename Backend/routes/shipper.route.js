import express from "express";
import { requireAuth, signToken } from "../server.js";

const router = express.Router();

router.post("/auth/login", (req, res) => {
  const { email = "driver@example.com" } = req.body || {};
  const token = signToken({ id: 200, role: "DRIVER", email });
  res.json({ token, user: { id: 200, role: "DRIVER", email } });
});

router.get("/orders", requireAuth(["DRIVER"]), (req, res) => {
  res.json({ items: [] });
});

router.patch("/orders/:id/status", requireAuth(["DRIVER"]), (req, res) => {
  const { id } = req.params;
  const { statusOrder = "DELIVERING" } = req.body || {};
  res.json({ id: Number(id), statusOrder });
});

router.post("/location", requireAuth(["DRIVER"]), (req, res) => {
  const { lat, lng } = req.body || {};
  res.json({ ok: true, lat, lng });
});

export default router;