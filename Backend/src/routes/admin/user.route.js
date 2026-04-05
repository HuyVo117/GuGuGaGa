import express from "express";
import { userController } from "../../controllers/user.controller.js";
const routerUser = express.Router();
routerUser.get("/", userController.getAll);
routerUser.get("/:id", userController.getById);
routerUser.post("/", userController.create);
routerUser.put("/:id", userController.update);
routerUser.delete("/:id", userController.delete);

export default routerUser;
