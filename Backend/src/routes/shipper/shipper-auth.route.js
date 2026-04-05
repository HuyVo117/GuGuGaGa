import { Router } from "express";
import { shipperController } from "../../controllers/shipper.controller.js";

const router = Router();

router.post("/login", shipperController.login);

export default router;
