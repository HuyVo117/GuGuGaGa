import express from "express";
import routerAuth from "./user/user-auth.route.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/checkRole.midlleware.js";
import routerCart from "./user/cart.route.js";
import routerOrder from "./user/order.route.js";
const routerUser = express.Router();

routerUser.use("/auth", routerAuth);

routerUser.use(protectRoute);
routerUser.use("/carts", routerCart);
routerUser.use("/orders", routerOrder);

// routerUser.use(protectRoute);
// router.use("/", checkRole("CUSTOMER") )
export default routerUser;
