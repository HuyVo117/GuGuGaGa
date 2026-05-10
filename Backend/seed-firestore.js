import admin from "firebase-admin";
import { readFileSync } from "fs";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

// Load service account
const serviceAccount = JSON.parse(
  readFileSync(
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json",
    "utf8"
  )
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function deleteCollection(collectionPath) {
  const snap = await db.collection(collectionPath).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

async function deleteSubCollections(collectionPath, subCollectionName) {
  const snap = await db.collection(collectionPath).get();
  for (const doc of snap.docs) {
    const subSnap = await doc.ref.collection(subCollectionName).get();
    if (!subSnap.empty) {
      const batch = db.batch();
      subSnap.docs.forEach((subDoc) => batch.delete(subDoc.ref));
      await batch.commit();
    }
  }
}

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);

  console.log("Deleting existing data...");

  // Delete sub-collections first
  await deleteSubCollections("bills", "billItems");
  await deleteSubCollections("orders", "orderItems");
  await deleteSubCollections("carts", "cartItems");
  await deleteSubCollections("combos", "comboItems");

  // Delete main collections
  await deleteCollection("bills");
  await deleteCollection("orders");
  await deleteCollection("carts");
  await deleteCollection("combos");
  await deleteCollection("products");
  await deleteCollection("categories");
  await deleteCollection("drivers");
  await deleteCollection("branches");
  await deleteCollection("users");

  console.log("Seeding data...");

  const now = new Date();

  // Create admin user
  const adminRef = await db.collection("users").add({
    name: "Admin",
    email: "admin@example.com",
    phone: "0900000000",
    passwordHash,
    role: "ADMIN",
    address: "GuGuGaGa HQ",
    createdAt: now,
    updatedAt: now,
  });

  // Create customer
  const customerRef = await db.collection("users").add({
    name: "Nguyen Van A",
    email: "a@example.com",
    phone: "0912345671",
    passwordHash,
    role: "CUSTOMER",
    address: "123 duong ABC",
    createdAt: now,
    updatedAt: now,
  });

  // Create branch
  const branchRef = await db.collection("branches").add({
    name: "Chi nhanh trung tam",
    phone: "02811112222",
    address: "1 Nguyen Hue, Quan 1",
    latitude: 10.775,
    longitude: 106.7,
    createdAt: now,
    updatedAt: now,
  });

  // Create category
  const categoryRef = await db.collection("categories").add({
    name: "Chicken",
  });

  // Create product
  const productRef = await db.collection("products").add({
    categoryId: categoryRef.id,
    name: "Ga ran truyen thong",
    price: 70000,
    desc: "Ga ran gion rum",
    image: null,
    createdAt: now,
    updatedAt: now,
  });

  // Create driver
  const driverRef = await db.collection("drivers").add({
    branchId: branchRef.id,
    name: "Tai xe Minh",
    phone: "0911111111",
    passwordHash,
    status: "AVAILABLE",
    latitude: null,
    longitude: null,
    createdAt: now,
    updatedAt: now,
  });

  // Create cart
  const cartRef = await db.collection("carts").add({
    userId: customerRef.id,
    branchId: branchRef.id,
    totalAmount: 70000,
    createdAt: now,
    updatedAt: now,
  });

  // Create cart item (sub-collection)
  await cartRef.collection("cartItems").add({
    productId: productRef.id,
    comboId: null,
    quantity: 1,
    price: 70000,
  });

  // Create order
  const orderRef = await db.collection("orders").add({
    userId: customerRef.id,
    branchId: branchRef.id,
    driverId: driverRef.id,
    totalAmount: 70000,
    status: "DRIVER_ASSIGNED",
    paymentMethod: "COD",
    deliveryAddress: "123 duong ABC",
    deliveryPhone: "0912345671",
    latitude: null,
    longitude: null,
    createdAt: now,
    updatedAt: now,
  });

  // Create order item (sub-collection)
  await orderRef.collection("orderItems").add({
    productId: productRef.id,
    comboId: null,
    quantity: 1,
    price: 70000,
  });

  // Create bill
  const billRef = await db.collection("bills").add({
    userId: customerRef.id,
    branchId: branchRef.id,
    totalPrice: 70000,
    createdAt: now,
    updatedAt: now,
  });

  // Create bill item (sub-collection)
  await billRef.collection("billItems").add({
    productId: productRef.id,
    quantity: 1,
    price: 70000,
  });

  console.log("Seed done!", {
    adminEmail: "admin@example.com",
    adminPassword: "123456",
    customerEmail: "a@example.com",
    customerPassword: "123456",
    driverPhone: "0911111111",
    driverPassword: "123456",
  });
}

main()
  .catch((error) => {
    console.error("SEED ERROR:", error);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
