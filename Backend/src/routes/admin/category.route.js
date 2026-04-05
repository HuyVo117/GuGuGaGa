import express from "express";
import { categoryController } from "../../controllers/category.controller.js";
const routerCategory = express.Router();

routerCategory.get("/", categoryController.getAllCategories);
routerCategory.post("/", categoryController.createCategory);
routerCategory.put("/:id", categoryController.updateCategory);
routerCategory.delete("/:id", categoryController.deleteCategory);
export default routerCategory;
