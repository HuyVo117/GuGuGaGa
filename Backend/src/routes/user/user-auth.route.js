import express from "express";
import { userAuthController } from "../../controllers/auth.controller.js";
const routerAuth = express.Router();
routerAuth.post("/sign-in", userAuthController.signIn);
routerAuth.post("/sign-up", userAuthController.signUp);
routerAuth.post("/sign-out", userAuthController.signOut);
routerAuth.get("/me", userAuthController.getMe);
routerAuth.put("/profile", userAuthController.updateProfile);

export default routerAuth;
