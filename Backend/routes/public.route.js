import express from "express";
import prisma from "../lib/prisma.js";

const router = express.Router();

router.get("/categories", async (req, res) => {
  const items = await prisma.category.findMany({ orderBy: { id: "desc" } });
  return res.json({ items });
});

router.get("/products", async (req, res) => {
  const items = await prisma.product.findMany({
    include: { category: true },
    orderBy: { id: "desc" },
  });
  return res.json({ items });
});

router.get("/combos", async (req, res) => {
  const items = await prisma.combo.findMany({
    include: {
      comboItems: {
        include: { product: true },
      },
    },
    orderBy: { id: "desc" },
  });
  return res.json({ items });
});

router.get("/branches", async (req, res) => {
  const items = await prisma.branch.findMany({ orderBy: { id: "desc" } });
  return res.json({ items });
});

export default router;