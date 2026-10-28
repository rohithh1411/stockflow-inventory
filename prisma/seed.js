// Fills the database with demo data:  npm run seed
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const DEMO = { email: "demo@stockflow.dev", password: "Demo12345!", org: "Demo Store" };

const demoProducts = [
  { name: "Cotton T-Shirt (M)", sku: "TS-M-001", quantity: 42, costPrice: 4.5, sellingPrice: 12 },
  { name: "Cotton T-Shirt (L)", sku: "TS-L-001", quantity: 4, costPrice: 4.5, sellingPrice: 12 },
  { name: "Denim Jacket", sku: "DJ-001", quantity: 0, costPrice: 22, sellingPrice: 59 },
  { name: "Canvas Tote Bag", sku: "TB-001", quantity: 120, lowStockThreshold: 20, costPrice: 1.8, sellingPrice: 7.5 },
  { name: "Running Socks (3 pack)", sku: "SK-003", quantity: 18, lowStockThreshold: 25, costPrice: 3, sellingPrice: 9 },
  { name: "Ceramic Mug", sku: "CM-001", quantity: 64, costPrice: 2.2, sellingPrice: 8.5 },
  { name: "Steel Water Bottle 750ml", sku: "WB-750", quantity: 9, lowStockThreshold: 10, costPrice: 6, sellingPrice: 18 },
  { name: "Notebook A5", sku: "NB-A5", quantity: 150, costPrice: 0.9, sellingPrice: 3.5 },
  { name: "Gel Pen Black", sku: "GP-BLK", quantity: 300, lowStockThreshold: 50, costPrice: 0.2, sellingPrice: 1.2 },
  { name: "Desk Lamp", sku: "DL-100", quantity: 7, costPrice: 11, sellingPrice: 29 },
  { name: "Phone Stand", sku: "PS-200", quantity: 5, costPrice: 2.5, sellingPrice: 10 },
  { name: "Wireless Mouse", sku: "WM-300", quantity: 26, costPrice: 7, sellingPrice: 19 },
];

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO.email } });
  if (existing) {
    console.log("Demo data already exists.");
  } else {
    await prisma.organization.create({
      data: {
        name: DEMO.org,
        users: { create: { email: DEMO.email, passwordHash: await bcrypt.hash(DEMO.password, 10) } },
        products: { create: demoProducts },
      },
    });

    // A second organization that reuses a SKU, to show that data is separated per organization.
    await prisma.organization.create({
      data: {
        name: "Other Store",
        users: { create: { email: "other@stockflow.dev", passwordHash: await bcrypt.hash(DEMO.password, 10) } },
        products: {
          create: [
            { name: "Hand-made Candle", sku: "TS-M-001", quantity: 11, sellingPrice: 15 },
            { name: "Soy Wax (1kg)", sku: "WAX-1", quantity: 2, sellingPrice: 12 },
          ],
        },
      },
    });
    console.log("Demo data created.");
  }
  console.log(`\nLog in with:\n  email:    ${DEMO.email}\n  password: ${DEMO.password}`);
  console.log("A second account, other@stockflow.dev (same password), has its own separate products.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
