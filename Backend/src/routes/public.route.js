import express from "express";
import { productController } from "../controllers/product.controller.js";
import { categoryController } from "../controllers/category.controller.js";
import { comboController } from "../controllers/combo.controller.js";
import { branchController } from "../controllers/branch.controller.js";
import { configController } from "../controllers/config.controller.js";
import { reviewController } from "../controllers/review.controller.js";
const routerPublic = express.Router();

routerPublic.get("/products", productController.getAll);
routerPublic.get("/products/:id", productController.getById);
routerPublic.get("/categories", categoryController.getAllCategories);
routerPublic.get("/combos", comboController.getAll);
routerPublic.get("/combos/:id", comboController.getById);
routerPublic.get("/branches", branchController.getAll);
routerPublic.get("/config/map-config", configController.getMapConfig);

routerPublic.get("/products/:id/reviews", reviewController.getProductReviews);
routerPublic.get("/drivers/:id/reviews", reviewController.getDriverReviews);

export default routerPublic;
