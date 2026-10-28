import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../lib/prisma.js";
import { createAccount, verifyLogin } from "../lib/accounts.js";
import * as inv from "../lib/inventory.js";

let counter = 0;
const newCtx = async (label = "org") => {
  counter += 1;
  const user = await createAccount({
    email: `${label}-${counter}@test.dev`,
    password: "password123",
    orgName: `Org ${label} ${counter}`,
  });
  return { userId: user.id, organizationId: user.organizationId };
};
const rejectsWith = (promise, status) => assert.rejects(promise, (err) => err.status === status);

before(() => {
  // Safety net: these tests create and wipe data, so never run them on dev.db.
  assert.ok(
    process.env.DATABASE_URL?.includes("test.db"),
    "Run the tests with `npm test`, which uses a separate test database."
  );
});
after(async () => {
  await prisma.$disconnect();
});

// ---------- accounts ----------
test("each signup gets its own organization", async () => {
  const a = await newCtx();
  const b = await newCtx();
  assert.notEqual(a.organizationId, b.organizationId);
});

test("login works, and a wrong password or unknown email is rejected", async () => {
  await createAccount({ email: "Login@Test.dev", password: "password123", orgName: "Login Org" });
  const user = await verifyLogin({ email: "login@test.dev", password: "password123" });
  assert.equal(user.email, "login@test.dev");
  await rejectsWith(verifyLogin({ email: "login@test.dev", password: "wrong-password" }), 401);
  await rejectsWith(verifyLogin({ email: "nobody@test.dev", password: "password123" }), 401);
});

test("signup rejects duplicate emails, weak passwords and bad emails", async () => {
  await createAccount({ email: "dup@test.dev", password: "password123", orgName: "Dup" });
  await rejectsWith(createAccount({ email: "DUP@test.dev", password: "password123", orgName: "Dup 2" }), 409);
  await rejectsWith(createAccount({ email: "short@test.dev", password: "short", orgName: "X" }), 400);
  await rejectsWith(createAccount({ email: "not-an-email", password: "password123", orgName: "X" }), 400);
  await rejectsWith(createAccount({ email: "noorg@test.dev", password: "password123", orgName: " " }), 400);
});

// ---------- tenant isolation ----------
test("another organization cannot read, edit, adjust or delete my product", async () => {
  const a = await newCtx("a");
  const b = await newCtx("b");
  const p = await inv.createProduct(a, { name: "Secret", sku: "SEC-1", quantity: 10 });

  await rejectsWith(inv.getProduct(b, p.id), 404);
  await rejectsWith(inv.updateProduct(b, p.id, { name: "Hacked", sku: "SEC-1", quantity: 0 }), 404);
  await rejectsWith(inv.adjustStock(b, p.id, -5), 404);
  await rejectsWith(inv.deleteProduct(b, p.id), 404);

  const still = await inv.getProduct(a, p.id);
  assert.equal(still.name, "Secret");
  assert.equal(still.quantity, 10);
});

test("lists, search and the dashboard only include my own products", async () => {
  const a = await newCtx("a");
  const b = await newCtx("b");
  await inv.createProduct(a, { name: "Alpha lamp", sku: "A-1", quantity: 4 });
  await inv.createProduct(b, { name: "Beta lamp", sku: "B-1", quantity: 3 });

  const listA = await inv.listProducts(a);
  assert.deepEqual(listA.map((p) => p.sku), ["A-1"]);
  const search = await inv.listProducts(b, { q: "lamp" });
  assert.deepEqual(search.map((p) => p.sku), ["B-1"]);

  const dashB = await inv.getDashboard(b);
  assert.equal(dashB.totalProducts, 1);
  assert.equal(dashB.totalUnits, 3);
});

test("settings belong to one organization", async () => {
  const a = await newCtx("a");
  const b = await newCtx("b");
  await inv.updateSettings(a, { defaultLowStockThreshold: 25 });
  assert.equal((await inv.getSettings(a)).defaultLowStockThreshold, 25);
  assert.equal((await inv.getSettings(b)).defaultLowStockThreshold, 5);
});

// ---------- SKU rules ----------
test("SKU is unique inside an organization (ignoring case) but reusable across organizations", async () => {
  const x = await newCtx("x");
  const y = await newCtx("y");
  const p = await inv.createProduct(x, { name: "Pen", sku: "pen-1", quantity: 1 });
  assert.equal(p.sku, "PEN-1");

  await rejectsWith(inv.createProduct(x, { name: "Pen 2", sku: "PEN-1", quantity: 1 }), 409);
  await inv.createProduct(y, { name: "Pen", sku: "PEN-1", quantity: 1 });

  const other = await inv.createProduct(x, { name: "Pencil", sku: "PCL-1", quantity: 1 });
  await rejectsWith(inv.updateProduct(x, other.id, { name: "Pencil", sku: "pen-1", quantity: 1 }), 409);
});

// ---------- stock ----------
test("stock adjustments add up and never go below zero", async () => {
  const x = await newCtx();
  const p = await inv.createProduct(x, { name: "Item", sku: "ITEM", quantity: 5 });

  assert.equal((await inv.adjustStock(x, p.id, 3)).quantity, 8);
  assert.equal((await inv.adjustStock(x, p.id, -8)).quantity, 0);
  await rejectsWith(inv.adjustStock(x, p.id, -1), 400);
  await rejectsWith(inv.adjustStock(x, p.id, 0), 400);
  assert.equal((await inv.getProduct(x, p.id)).quantity, 0);
});

test("simultaneous adjustments cannot oversell stock", async () => {
  const x = await newCtx();
  const p = await inv.createProduct(x, { name: "Hot item", sku: "HOT", quantity: 10 });

  const results = await Promise.allSettled(Array.from({ length: 5 }, () => inv.adjustStock(x, p.id, -3)));
  const succeeded = results.filter((r) => r.status === "fulfilled").length;

  assert.equal(succeeded, 3);
  assert.equal((await inv.getProduct(x, p.id)).quantity, 1);
});

// ---------- low stock ----------
test("low stock: own threshold beats the default, and equal counts as low", async () => {
  const x = await newCtx();
  await inv.createProduct(x, { name: "A", sku: "A", quantity: 5 }); // default 5 -> low
  await inv.createProduct(x, { name: "B", sku: "B", quantity: 6 }); // above default -> ok
  await inv.createProduct(x, { name: "C", sku: "C", quantity: 8, lowStockThreshold: 10 }); // own threshold -> low
  await inv.createProduct(x, { name: "D", sku: "D", quantity: 0 }); // out of stock

  const dash = await inv.getDashboard(x);
  assert.equal(dash.totalProducts, 4);
  assert.equal(dash.totalUnits, 19);
  assert.deepEqual(dash.lowStock.map((p) => p.sku).sort(), ["A", "C", "D"]);

  const byName = Object.fromEntries((await inv.listProducts(x)).map((p) => [p.name, p.status]));
  assert.deepEqual(byName, { A: "low", B: "ok", C: "low", D: "out" });
});

test("changing the default threshold changes which products are low", async () => {
  const x = await newCtx();
  await inv.createProduct(x, { name: "B", sku: "B", quantity: 6 });
  assert.equal((await inv.getDashboard(x)).lowStock.length, 0);

  await inv.updateSettings(x, { defaultLowStockThreshold: 10 });
  assert.equal((await inv.getDashboard(x)).lowStock.length, 1);

  await rejectsWith(inv.updateSettings(x, { defaultLowStockThreshold: -1 }), 400);
  await rejectsWith(inv.updateSettings(x, { defaultLowStockThreshold: "" }), 400);
});

// ---------- validation through the service ----------
test("creating a product validates input", async () => {
  const x = await newCtx();
  await rejectsWith(inv.createProduct(x, { name: "", sku: "A" }), 400);
  await rejectsWith(inv.createProduct(x, { name: "A", sku: "" }), 400);
  await rejectsWith(inv.createProduct(x, { name: "A", sku: "A", quantity: -1 }), 400);
  await rejectsWith(inv.createProduct(x, { name: "A", sku: "A", quantity: 1.5 }), 400);
});

test("a deleted product is gone", async () => {
  const x = await newCtx();
  const p = await inv.createProduct(x, { name: "Temp", sku: "TMP", quantity: 1 });
  await inv.deleteProduct(x, p.id);
  await rejectsWith(inv.getProduct(x, p.id), 404);
  await rejectsWith(inv.deleteProduct(x, p.id), 404);
});
