import express from "express";

const router = express.Router();

router.get("/categories", (req, res) => {
  res.json({ items: [] });
});

router.get("/products", (req, res) => {
  res.json({ items: [] });
});

router.get("/combos", (req, res) => {
  res.json({ items: [] });
});

router.get("/branches", (req, res) => {
  res.json({ items: [] });
});

export default router;