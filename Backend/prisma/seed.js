import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";

async function main() {
  const hashed = await bcrypt.hash("123456", 10);

  await prisma.user.upsert({
    where: { email: "admin@gugugaga.vn" },
    update: {},
    create: {
      email: "admin@gugugaga.vn",
      password: hashed,
      role: "ADMIN",
    },
  });

  await prisma.driver.upsert({
    where: { email: "driver@gugugaga.vn" },
    update: {},
    create: {
      email: "driver@gugugaga.vn",
      password: hashed,
      statusDriver: "ONLINE",
    },
  });

  const branch = await prisma.branch.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "GuGuGaGa CN1",
      address: "HCM City",
    },
  });

  const category = await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Ga ran",
    },
  });

  await prisma.product.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Ga ran truyen thong",
      price: 39000,
      categoryId: category.id,
    },
  });

  await prisma.product.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "Ga sot cay",
      price: 45000,
      categoryId: category.id,
    },
  });

  // eslint-disable-next-line no-console
  console.log("Seed completed", { branchId: branch.id, categoryId: category.id });
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

