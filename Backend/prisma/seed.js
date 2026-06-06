import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);

  await prisma.billItem.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.comboItem.deleteMany();
  await prisma.combo.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@example.com",
      phone: "0900000000",
      passwordHash,
      role: "ADMIN",
      address: "GuGuGaGa HQ",
    },
  });

  const customer = await prisma.user.create({
    data: {
      name: "Nguyen Van A",
      email: "a@example.com",
      phone: "0912345671",
      passwordHash,
      role: "CUSTOMER",
      address: "123 duong ABC",
    },
  });

  const branch = await prisma.branch.create({
    data: {
      name: "Chi nhanh trung tam",
      phone: "02811112222",
      address: "1 Nguyen Hue, Quan 1",
      latitude: 10.775,
      longitude: 106.7,
    },
  });

  const category = await prisma.category.create({
    data: { name: "Chicken" },
  });

  const product = await prisma.product.create({
    data: {
      categoryId: category.id,
      name: "Ga ran truyen thong",
      price: 70000,
      desc: "Ga ran gion rum",
      image: null,
    },
  });

  const driver = await prisma.driver.create({
    data: {
      branchId: branch.id,
      name: "Tai xe Minh",
      phone: "0911111111",
      passwordHash,
      status: "AVAILABLE",
    },
  });

  const cart = await prisma.cart.create({
    data: {
      userId: customer.id,
      branchId: branch.id,
      totalAmount: product.price,
    },
  });

  await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: product.id,
      quantity: 1,
      price: product.price,
    },
  });

  await prisma.order.create({
    data: {
      userId: customer.id,
      branchId: branch.id,
      driverId: driver.id,
      totalAmount: product.price,
      status: "DRIVER_ASSIGNED",
      paymentMethod: "COD",
      deliveryAddress: customer.address || "",
      deliveryPhone: customer.phone,
      orderItem: {
        create: [
          {
            productId: product.id,
            quantity: 1,
            price: product.price,
          },
        ],
      },
    },
  });

  await prisma.bill.create({
    data: {
      userId: customer.id,
      branchId: branch.id,
      totalPrice: product.price,
      billItem: {
        create: [
          {
            productId: product.id,
            quantity: 1,
            price: product.price,
          },
        ],
      },
    },
  });

  console.log("Seed done", {
    adminEmail: admin.email,
    adminPassword: "123456",
    customerEmail: customer.email,
    customerPassword: "123456",
  });
}

main()
  .catch((error) => {
    console.error("SEED ERROR:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
