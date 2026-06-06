import db from "../configs/firestore.js";
import { deleteImageService } from "./upload.service.js";

const combosRef = db.collection("combos");
const categoriesRef = db.collection("categories");
const productsRef = db.collection("products");

const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
};

// Helper: populate combo with category + comboItems (with products)
async function populateCombo(comboDoc) {
  const combo = { id: comboDoc.id, ...(comboDoc.data ? comboDoc.data() : comboDoc) };

  // Populate category
  if (combo.categoryId) {
    const catDoc = await categoriesRef.doc(combo.categoryId).get();
    combo.category = catDoc.exists ? { id: catDoc.id, ...catDoc.data() } : null;
  } else {
    combo.category = null;
  }

  // Populate comboItems sub-collection
  const itemsSnap = await combosRef.doc(combo.id).collection("comboItems").get();
  combo.comboItems = [];
  for (const itemDoc of itemsSnap.docs) {
    const item = { id: itemDoc.id, ...itemDoc.data() };
    // Populate product in each comboItem
    if (item.productId) {
      const prodDoc = await productsRef.doc(item.productId).get();
      if (prodDoc.exists) {
        const product = { id: prodDoc.id, ...prodDoc.data() };
        // Populate category inside product
        if (product.categoryId) {
          const catDoc = await categoriesRef.doc(product.categoryId).get();
          product.category = catDoc.exists ? { id: catDoc.id, ...catDoc.data() } : null;
        }
        item.product = product;
      } else {
        item.product = null;
      }
    }
    combo.comboItems.push(item);
  }

  return combo;
}

export const comboService = {
  async getAll(categoryId) {
    let query = combosRef;
    if (categoryId) {
      query = combosRef.where("categoryId", "==", categoryId);
    }
    const snap = await query.get();
    const combos = [];
    for (const doc of snap.docs) {
      combos.push(await populateCombo(doc));
    }
    return combos;
  },

  async getById(id) {
    const doc = await combosRef.doc(id).get();
    if (!doc.exists) return null;
    return await populateCombo(doc);
  },

  async create(data) {
    const { name, price, categoryId, desc, image, comboItems } = data;

    // Verify category
    const catDoc = await categoriesRef.doc(categoryId).get();
    if (!catDoc.exists) throw new Error("Category not found");

    const now = new Date();
    const docRef = await combosRef.add({
      name,
      price: Number(price),
      categoryId,
      desc: desc || null,
      image: image || null,
      createdAt: now,
      updatedAt: now,
    });

    // Create comboItems as sub-collection
    const createdItems = [];
    if (comboItems && comboItems.length > 0) {
      for (const item of comboItems) {
        const itemRef = await docRef.collection("comboItems").add({
          productId: item.productId,
          quantity: Number(item.quantity),
        });
        createdItems.push({ id: itemRef.id, productId: item.productId, quantity: Number(item.quantity) });
      }
    }

    return {
      id: docRef.id,
      name,
      price: Number(price),
      categoryId,
      desc,
      image,
      createdAt: now,
      updatedAt: now,
      comboItems: createdItems,
    };
  },

  async update(id, data) {
    const { name, price, categoryId, desc, image, comboItems } = data;

    const docRef = combosRef.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) throw new Error("Combo not found");
    const combo = doc.data();

    // Handle image deletion
    if (image && combo.image && image !== combo.image) {
      const publicId = getPublicIdFromUrl(combo.image);
      if (publicId) {
        await deleteImageService(publicId);
      }
    }

    // Update combo fields
    const updateData = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = Number(price);
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (desc !== undefined) updateData.desc = desc;
    if (image !== undefined) updateData.image = image;

    await docRef.update(updateData);

    // If comboItems provided, delete old and create new
    if (comboItems) {
      const oldItems = await docRef.collection("comboItems").get();
      const batch = db.batch();
      oldItems.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      for (const item of comboItems) {
        await docRef.collection("comboItems").add({
          productId: item.productId,
          quantity: Number(item.quantity),
        });
      }
    }

    // Return updated combo
    const updatedDoc = await docRef.get();
    const itemsSnap = await docRef.collection("comboItems").get();
    return {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      comboItems: itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    };
  },

  async delete(id) {
    const docRef = combosRef.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) throw new Error("Combo not found");
    const combo = doc.data();

    if (combo.image) {
      const publicId = getPublicIdFromUrl(combo.image);
      if (publicId) {
        await deleteImageService(publicId);
      }
    }

    // Delete comboItems sub-collection
    const items = await docRef.collection("comboItems").get();
    const batch = db.batch();
    items.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    await docRef.delete();
    return { message: "Combo deleted successfully" };
  },
};
