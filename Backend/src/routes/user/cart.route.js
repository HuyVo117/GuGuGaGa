import express from "express";
import { cartController } from "../../controllers/cart.controller.js";

const routerCart = express.Router();

// Lấy cart theo branch
routerCart.get("/", cartController.getCart);

routerCart.post("/create", cartController.createCart);

// Thêm sản phẩm vào cart
routerCart.post("/add", cartController.addToCart);

// Cập nhật số lượng 1 item
routerCart.put("/:id", cartController.updateQuantity);

// Xóa item khỏi cart
routerCart.delete("/:id", cartController.removeItem);

export default routerCart;
