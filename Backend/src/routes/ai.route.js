import express from "express";
import multer from "multer";
import { aiController } from "../controllers/ai.controller.js";

// Set up memory storage for uploaded images (max 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const routerAI = express.Router();

routerAI.post("/recognize-food", upload.single("image"), aiController.recognizeFood);
routerAI.post("/scan-receipt", upload.single("image"), aiController.scanReceipt);

export default routerAI;
