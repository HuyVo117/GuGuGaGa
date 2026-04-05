import express from "express";
import { userAuthController } from "../../controllers/auth.controller.js";
import { protectRoute } from "../../middleware/auth.middleware.js";

const routerAuth = express.Router();

routerAuth.post("/sign-in", userAuthController.signIn);
routerAuth.post("/sign-up", userAuthController.signUp);
routerAuth.post("/sign-out", userAuthController.signOut);
routerAuth.get("/me", protectRoute, userAuthController.getMe);
routerAuth.put("/profile", protectRoute, userAuthController.updateProfile);

export default routerAuth;
