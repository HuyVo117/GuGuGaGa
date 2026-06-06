import express from "express";
import { dashboardController } from "../../controllers/dashboard.controller.js";

const routerDashboard = express.Router();

routerDashboard.get("/", dashboardController.getStats);

export default routerDashboard;
