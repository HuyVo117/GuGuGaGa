import express from "express";
import routerAuth from "./user/user-auth.route.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/checkRole.midlleware.js";
import routerCart from "./user/cart.route.js";
import routerOrder from "./user/order.route.js";
import routerNotification from "./user/notification.route.js";
import { orderController } from "../controllers/order.controller.js";

const routerUser = express.Router();

routerUser.use("/auth", routerAuth);

// Webhook công khai đối soát chuyển khoản (không yêu cầu token)
routerUser.post("/orders/webhook/casso", orderController.cassoWebhook);

routerUser.use(protectRoute);
routerUser.use("/carts", routerCart);
routerUser.use("/orders", routerOrder);
routerUser.use("/notifications", routerNotification);

// routerUser.use(protectRoute);
// router.use("/", checkRole("CUSTOMER") )
export default routerUser;
