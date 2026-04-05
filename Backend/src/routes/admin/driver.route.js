import express from "express";
import { driverController } from "../../controllers/driver.controller.js";

const routerDriver = express.Router();

// Lấy danh sách tài xế
routerDriver.get("/", driverController.getAll);

// Lấy 1 tài xế theo id
routerDriver.get("/:id", driverController.getById);

// Tạo tài xế
routerDriver.post("/create", driverController.create);

// Cập nhật tài xế
routerDriver.put("/:id", driverController.update);

// Xóa tài xế
routerDriver.delete("/:id", driverController.remove);

export default routerDriver;
