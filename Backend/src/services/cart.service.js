import db from "../configs/firestore.js";

const cartsRef = db.collection("carts");
const productsRef = db.collection("products");
const combosRef = db.collection("combos");
const categoriesRef = db.collection("categories");

// Helper: populate cart with cartItems + product/combo data
async function populateCart(cart) {
  const itemsSnap = await cartsRef.doc(cart.id).collection("cartItems").get();
  cart.cartItem = [];
  for (const itemDoc of itemsSnap.docs) {
    const item = { id: itemDoc.id, ...itemDoc.data() };
    // Populate product
    if (item.productId) {
      const prodDoc = await productsRef.doc(item.productId).get();
      if (prodDoc.exists) {
        item.product = { id: prodDoc.id, ...prodDoc.data() };
        if (item.product.categoryId) {
          const catDoc = await categoriesRef.doc(item.product.categoryId).get();
          item.product.category = catDoc.exists ? { id: catDoc.id, ...catDoc.data() } : null;
        }
      } else {
        item.product = null;
      }
    } else {
      item.product = null;
    }
    // Populate combo
    if (item.comboId) {
      const comboDoc = await combosRef.doc(item.comboId).get();
      item.combo = comboDoc.exists ? { id: comboDoc.id, ...comboDoc.data() } : null;
    } else {
      item.combo = null;
    }
    cart.cartItem.push(item);
  }
  return cart;
}

export const cartService = {
  // Tạo cart hoặc lấy cart hiện có
  createCart: async (userId, branchId) => {
    // Tìm cart đã tồn tại bằng cách duyệt tất cả carts của user
    const userCarts = await cartsRef.where("userId", "==", userId).get();
    
    for (const doc of userCarts.docs) {
      if (doc.data().branchId === branchId) {
        const cart = { id: doc.id, ...doc.data() };
        await populateCart(cart);
        return cart;
      }
    }

    const now = new Date();
    const docRef = await cartsRef.add({
      userId,
      branchId,
      totalAmount: 0,
      createdAt: now,
      updatedAt: now,
    });

    const cart = { id: docRef.id, userId, branchId, totalAmount: 0, createdAt: now, updatedAt: now, cartItem: [] };
    return cart;
  },

  // Thêm sản phẩm vào cart
  addToCart: async (userId, branchId, productId, comboId, quantity = 1) => {
    // Lấy cart hiện tại - dùng cách scan để tránh lỗi composite index
    const userCarts = await cartsRef.where("userId", "==", userId).get();
    let cartDoc = null;
    
    for (const doc of userCarts.docs) {
      if (doc.data().branchId === branchId) {
        cartDoc = doc;
        break;
      }
    }

    if (!cartDoc) throw new Error("Vui lòng chọn chi nhánh trước.");

    const cart = { id: cartDoc.id, ...cartDoc.data() };
    await populateCart(cart);

    let price = 0;

    if (productId) {
      const prodDoc = await productsRef.doc(productId).get();
      if (!prodDoc.exists) throw new Error("Sản phẩm không tồn tại");
      price = prodDoc.data().price;
    } else if (comboId) {
      const comboDoc = await combosRef.doc(comboId).get();
      if (!comboDoc.exists) throw new Error("Combo không tồn tại");
      price = comboDoc.data().price;
    } else {
      throw new Error("Phải chọn sản phẩm hoặc combo");
    }

    // Kiểm tra sản phẩm/combo đã có trong cart chưa
    const existingItem = cart.cartItem.find((i) => {
      if (productId) return i.productId === productId;
      if (comboId) return i.comboId === comboId;
      return false;
    });

    const cartItemsRef = cartsRef.doc(cart.id).collection("cartItems");

    if (existingItem) {
      await cartItemsRef.doc(existingItem.id).update({
        quantity: existingItem.quantity + quantity,
      });
    } else {
      await cartItemsRef.add({
        productId: productId || null,
        comboId: comboId || null,
        quantity,
        price,
      });
    }

    return cartService.recalculate(cart.id);
  },

  // Cập nhật quantity sản phẩm
  updateQuantity: async (cartItemId, quantity, cartId) => {
    if (quantity <= 0) throw new Error("Số lượng phải lớn hơn 0");

    // We need to find which cart this item belongs to
    // cartId should be passed from controller
    if (!cartId) {
      // Fallback: search all carts for this item (less efficient)
      const allCarts = await cartsRef.get();
      for (const cartDoc of allCarts.docs) {
        const itemDoc = await cartDoc.ref.collection("cartItems").doc(cartItemId).get();
        if (itemDoc.exists) {
          cartId = cartDoc.id;
          break;
        }
      }
    }

    if (!cartId) throw new Error("Cart item not found");

    await cartsRef.doc(cartId).collection("cartItems").doc(cartItemId).update({ quantity });
    return cartService.recalculate(cartId);
  },

  // Xóa sản phẩm khỏi cart
  removeItem: async (cartItemId, cartId) => {
    // Find the cart this item belongs to
    if (!cartId) {
      const allCarts = await cartsRef.get();
      for (const cartDoc of allCarts.docs) {
        const itemDoc = await cartDoc.ref.collection("cartItems").doc(cartItemId).get();
        if (itemDoc.exists) {
          cartId = cartDoc.id;
          break;
        }
      }
    }

    if (!cartId) throw new Error("Sản phẩm không tồn tại trong giỏ hàng");

    await cartsRef.doc(cartId).collection("cartItems").doc(cartItemId).delete();
    return cartService.recalculate(cartId);
  },

  // Tính tổng tiền cart
  recalculate: async (cartId) => {
    const cartRef = cartsRef.doc(cartId);
    const cartDoc = await cartRef.get();
    if (!cartDoc.exists) throw new Error("Cart not found");

    const cart = { id: cartDoc.id, ...cartDoc.data() };
    await populateCart(cart);

    let total = 0;
    cart.cartItem.forEach((item) => {
      const price = item.product ? item.product.price : item.combo ? item.combo.price : 0;
      total += item.quantity * price;
    });

    await cartRef.update({ totalAmount: total, updatedAt: new Date() });

    // Re-fetch to return updated cart
    const updatedDoc = await cartRef.get();
    const updatedCart = { id: updatedDoc.id, ...updatedDoc.data() };
    await populateCart(updatedCart);
    return updatedCart;
  },

  // Lấy cart theo branch
  getCart: async (userId, branchId) => {
    // Dùng single-field query + filter thủ công để tránh lỗi composite index
    const userCarts = await cartsRef.where("userId", "==", userId).get();
    
    let matchedDoc = null;
    for (const doc of userCarts.docs) {
      if (doc.data().branchId === branchId) {
        matchedDoc = doc;
        break;
      }
    }

    if (!matchedDoc) {
      return { totalAmount: 0, cartItem: [] };
    }

    const cart = { id: matchedDoc.id, ...matchedDoc.data() };
    await populateCart(cart);
    return cart;
  },
};
