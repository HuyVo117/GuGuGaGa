import express from "express";
import { comboController } from "../../controllers/combo.controller.js";

const routerCombo = express.Router();

routerCombo.get("/", comboController.getAll);
routerCombo.get("/:id", comboController.getById);
routerCombo.post("/", comboController.create);
routerCombo.put("/:id", comboController.update);
routerCombo.delete("/:id", comboController.delete);

export default routerCombo;
