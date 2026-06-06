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
  await db.collection("users").add({
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

  // 30 classes matching the AI model (and their corresponding mock display names/prices)
  const categoriesToSeed = [
    { name: "Bánh Bèo", productName: "Bánh Bèo Chén Miền Trung", price: 30000, desc: "Bánh bèo chén dẻo thơm, nhân tôm chấy đậm vị" },
    { name: "Bánh Bột Lọc", productName: "Bánh Bột Lọc Trần Nhân Tôm Thịt", price: 35000, desc: "Bánh bột lọc dẻo trong suốt, tôm thịt thơm ngon" },
    { name: "Bánh Căn", productName: "Bánh Căn Trứng Cút", price: 40000, desc: "Bánh căn nóng hổi kèm nước chấm xíu mại" },
    { name: "Bánh Canh", productName: "Bánh Canh Cua Bột Gạo", price: 50000, desc: "Bánh canh cua nước sệt ngọt thanh hấp dẫn" },
    { name: "Bánh Chưng", productName: "Bánh Chưng Đậu Xanh Thịt Mỡ", price: 60000, desc: "Bánh chưng truyền thống dẻo ngon chuẩn vị" },
    { name: "Bánh Cuốn", productName: "Bánh Cuốn Nóng Thịt Mộc Nhĩ", price: 30000, desc: "Bánh cuốn tráng mỏng kèm chả lụa thơm lừng" },
    { name: "Bánh Đúc", productName: "Bánh Đúc Nóng Hà Nội", price: 25000, desc: "Bánh đúc nóng kèm thịt băm, mộc nhĩ, hành phi" },
    { name: "Bánh Giò", productName: "Bánh Giò Nóng Nhân Thịt Trứng Cút", price: 20000, desc: "Bánh giò nóng hổi dẻo thơm ngậy béo" },
    { name: "Bánh Khọt", productName: "Bánh Khọt Vũng Tàu Tôm Tươi", price: 45000, desc: "Bánh khọt giòn rụm với tôm tươi thơm ngậy" },
    { name: "Bánh Mì", productName: "Bánh Mì Thịt Nướng Đặc Biệt", price: 25000, desc: "Bánh mì giòn rụm nhân thịt nướng đậm đà" },
    { name: "Bánh Pía", productName: "Bánh Pía Sầu Riêng Trứng Muối", price: 15000, desc: "Bánh pía Sóc Trăng thơm ngậy sầu riêng" },
    { name: "Bánh Tét", productName: "Bánh Tét Nhân Thịt Mỡ Đậu Xanh", price: 55000, desc: "Bánh tét truyền thống thơm dẻo" },
    { name: "Bánh Tráng Nướng", productName: "Bánh Tráng Nướng Đà Lạt Mỡ Hành", price: 20000, desc: "Bánh tráng nướng giòn rụm đầy đủ topping" },
    { name: "Bánh Xèo", productName: "Bánh Xèo Nam Bộ Tôm Thịt", price: 50000, desc: "Bánh xèo giòn tan thơm nước cốt dừa" },
    { name: "Bún Bò Huế", productName: "Bún Bò Huế Đặc Biệt Giò Chả", price: 55000, desc: "Bún bò huế chuẩn vị nước dùng đậm đà" },
    { name: "Bún Đậu Mắm Tôm", productName: "Mẹt Bún Đậu Mắm Tôm Đầy Đủ", price: 65000, desc: "Bún đậu với thịt luộc, chả cốm, mắm tôm pha ngon" },
    { name: "Bún Mắm", productName: "Bún Mắm Miền Tây Sạch Sẽ", price: 60000, desc: "Bún mắm đậm đà tôm, mực, heo quay ngon tuyệt" },
    { name: "Bún Riêu", productName: "Bún Riêu Cua Sườn Sụn", price: 45000, desc: "Bún riêu cua thanh mát thơm ngon" },
    { name: "Bún Thịt Nướng", productName: "Bún Thịt Nướng Chả Giò", price: 45000, desc: "Bún thịt nướng thơm lừng kèm chả giò giòn rụm" },
    { name: "Cá Kho Tộ", productName: "Cơm Cá Kho Tộ Đậm Đà", price: 55000, desc: "Cá lóc kho tộ nước sốt sệt cay ăn cùng cơm nóng" },
    { name: "Canh Chua", productName: "Cơm Canh Chua Cá Hồi", price: 60000, desc: "Canh chua cá hồi thanh mát chuẩn vị cơm nhà" },
    { name: "Cao Lầu", productName: "Cao Lầu Hội An Thịt Xá Xíu", price: 50000, desc: "Cao lầu Hội An dai giòn thơm ngon đậm đà" },
    { name: "Cháo Lòng", productName: "Cháo Lòng Nóng Hổi Đầy Đủ", price: 35000, desc: "Cháo lòng thơm ngon bổ dưỡng kèm đĩa lòng thập cẩm" },
    { name: "Cơm Tấm", productName: "Cơm Tấm Sườn Bì Chả Trứng", price: 45000, desc: "Cơm tấm sườn nướng thơm lừng chuẩn vị Sài Gòn" },
    { name: "Gỏi Cuốn", productName: "Gỏi Cuốn Tôm Thịt Nước Tương", price: 10000, desc: "Gỏi cuốn thanh mát nhiều tôm thịt" },
    { name: "Hủ Tiếu", productName: "Hủ Tiếu Nam Vang Khô/Nước", price: 55000, desc: "Hủ tiếu Nam Vang nước dùng ngọt thanh xương ống" },
    { name: "Mỳ Quảng", productName: "Mỳ Quảng Tôm Thịt Trứng Cút", price: 40000, desc: "Mỳ quảng đậm đà chuẩn vị miền Trung" },
    { name: "Nem Chua", productName: "Nem Chua Rán Ngon Giòn", price: 30000, desc: "Đĩa nem chua rán nóng hổi thơm ngon ăn vặt" },
    { name: "Phở", productName: "Phở Bò Tái Nạm Gầu Cực Chất", price: 65000, desc: "Phở bò truyền thống nước dùng hầm xương trong 24h" },
    { name: "Xôi Xéo", productName: "Xôi Xéo Ruốc Hành Phi Mỡ Gà", price: 20000, desc: "Xôi xéo dẻo thơm hành phi vàng ruộm ngậy béo" }
  ];

  let productRef = null;

  for (const cat of categoriesToSeed) {
    const catRef = await db.collection("categories").add({ name: cat.name });
    const prodRef = await db.collection("products").add({
      categoryId: catRef.id,
      name: cat.productName,
      price: cat.price,
      desc: cat.desc,
      image: null,
      createdAt: now,
      updatedAt: now
    });
    if (!productRef) {
      productRef = prodRef;
    }
  }

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
