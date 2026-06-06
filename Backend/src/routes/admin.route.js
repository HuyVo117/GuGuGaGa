import express from "express";
import routerAuth from "./admin/admin-auth.route.js";
import routerCategory from "./admin/category.route.js";
import routerProduct from "./admin/product.route.js";
import routerUser from "./admin/user.route.js";
import routerDashboard from "./admin/dashboard.route.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/checkRole.midlleware.js";
import routerOrder from "./admin/order.route.js";
import {
  uploadImageProduct,
  uploadImageCombo,
} from "../controllers/upload.controller.js";
import { upload } from "../middleware/upload.middleware.js";
import routerCombo from "./admin/combo.route.js";
import routerDriver from "./admin/driver.route.js";
import routerBranch from "./admin/branch.route.js";
const routerAdmin = express.Router();

// Public auth routes
routerAdmin.use("/auth", routerAuth);

// Các route admin cần login + role ADMIN
routerAdmin.use(protectRoute);

routerAdmin.use("/categories", checkRole("ADMIN"), routerCategory);
routerAdmin.use("/products", checkRole("ADMIN"), routerProduct);
routerAdmin.use("/users", checkRole("ADMIN"), routerUser);
routerAdmin.use("/orders", checkRole("ADMIN"), routerOrder);

routerAdmin.use("/combos", checkRole("ADMIN"), routerCombo);
routerAdmin.use("/drivers", checkRole("ADMIN"), routerDriver);
routerAdmin.use("/branches", checkRole("ADMIN"), routerBranch);
routerAdmin.use("/dashboard", checkRole("ADMIN"), routerDashboard);
routerAdmin.post(
  "/upload/product",
  checkRole("ADMIN"),
  upload.single("image"),
  uploadImageProduct
);
routerAdmin.post(
  "/upload/combo",
  checkRole("ADMIN"),
  upload.single("image"),
  uploadImageCombo
);
export default routerAdmin;
