import express from "express";
import { notificationController } from "../../controllers/notification.controller.js";

const routerNotification = express.Router();

routerNotification.get("/", notificationController.getNotifications);
routerNotification.patch("/read-all", notificationController.markAllAsRead);
routerNotification.patch("/:id/read", notificationController.markAsRead);

export default routerNotification;
