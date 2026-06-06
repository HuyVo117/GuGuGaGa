import express from "express";
import { adminAuthController } from "../../controllers/admin-auth.controller.js";
import { protectRoute } from "../../middleware/auth.middleware.js";

const routerAuth = express.Router();

routerAuth.post("/sign-in", adminAuthController.signIn);
routerAuth.post("/sign-out", adminAuthController.signOut);
routerAuth.get("/me", protectRoute, adminAuthController.getMe);

export default routerAuth;
