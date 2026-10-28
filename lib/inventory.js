import { prisma } from "./prisma.js";
import { AppError } from "./errors.js";
import { parseProduct, parseDelta, parseThreshold } from "./validate.js";
import { effectiveThreshold, isLowStock, stockStatus } from "./stock.js";

// Every function takes `ctx` = { userId, organizationId } from the login token
// and puts organizationId in every query. That is the whole tenant-isolation rule.

function toId(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new AppError(404, "Product not found");
  return n;
}

async function getOrg(ctx) {
  const org = await prisma.organization.findUnique({ where: { id: ctx.organizationId } });
  if (!org) throw new AppError(401, "Unauthorized");
  return org;
}

const decorate = (p, def) => ({ ...p, isLowStock: isLowStock(p, def), status: stockStatus(p, def) });

async function findOwn(ctx, id) {
  const product = await prisma.product.findFirst({
    where: { id: toId(id), organizationId: ctx.organizationId },
  });
  if (!product) throw new AppError(404, "Product not found");
  return product;
}

function rethrowUnique(e) {
  if (e?.code === "P2002") throw new AppError(409, "A product with this SKU already exists");
  throw e;
}

export async function listProducts(ctx, { q = "" } = {}) {
  const term = String(q).trim();
  const org = await getOrg(ctx);
  const products = await prisma.product.findMany({
    where: {
      organizationId: ctx.organizationId,
      ...(term ? { OR: [{ name: { contains: term } }, { sku: { contains: term } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return products.map((p) => decorate(p, org.defaultLowStockThreshold));
}

export async function getProduct(ctx, id) {
  const [product, org] = await Promise.all([findOwn(ctx, id), getOrg(ctx)]);
  return decorate(product, org.defaultLowStockThreshold);
}

export async function createProduct(ctx, input) {
  const { error, data } = parseProduct(input);
  if (error) throw new AppError(400, error);
  try {
    const product = await prisma.product.create({
      data: { ...data, organizationId: ctx.organizationId, lastUpdatedBy: ctx.userId },
    });
    return decorate(product, (await getOrg(ctx)).defaultLowStockThreshold);
  } catch (e) {
    rethrowUnique(e);
  }
}

export async function updateProduct(ctx, id, input) {
  const existing = await findOwn(ctx, id);
  const { error, data } = parseProduct(input);
  if (error) throw new AppError(400, error);
  try {
    await prisma.product.updateMany({
      where: { id: existing.id, organizationId: ctx.organizationId },
      data: { ...data, lastUpdatedBy: ctx.userId },
    });
  } catch (e) {
    rethrowUnique(e);
  }
  return getProduct(ctx, existing.id);
}

// Adds delta (positive or negative) to the quantity in one atomic update.
// The `gte` condition stops the stock going below zero even if two requests
// arrive at the same time.
export async function adjustStock(ctx, id, deltaInput) {
  const { error, value: delta } = parseDelta(deltaInput);
  if (error) throw new AppError(400, error);
  const productId = toId(id);

  const result = await prisma.product.updateMany({
    where: {
      id: productId,
      organizationId: ctx.organizationId,
      quantity: { gte: delta < 0 ? -delta : 0 },
    },
    data: { quantity: { increment: delta }, lastUpdatedBy: ctx.userId },
  });

  if (result.count === 0) {
    await findOwn(ctx, productId); // throws 404 if it is not this org's product
    throw new AppError(400, "Stock cannot go below 0");
  }
  return getProduct(ctx, productId);
}

export async function deleteProduct(ctx, id) {
  const result = await prisma.product.deleteMany({
    where: { id: toId(id), organizationId: ctx.organizationId },
  });
  if (result.count === 0) throw new AppError(404, "Product not found");
}

export async function getDashboard(ctx) {
  const org = await getOrg(ctx);
  const products = await prisma.product.findMany({ where: { organizationId: ctx.organizationId } });
  const def = org.defaultLowStockThreshold;

  return {
    organizationName: org.name,
    totalProducts: products.length,
    totalUnits: products.reduce((sum, p) => sum + p.quantity, 0),
    lowStock: products
      .filter((p) => isLowStock(p, def))
      .sort((a, b) => a.quantity - b.quantity)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        quantity: p.quantity,
        threshold: effectiveThreshold(p, def),
        status: stockStatus(p, def),
      })),
  };
}

export async function getSettings(ctx) {
  const org = await getOrg(ctx);
  return { defaultLowStockThreshold: org.defaultLowStockThreshold };
}

export async function updateSettings(ctx, input) {
  const { error, value } = parseThreshold(input.defaultLowStockThreshold);
  if (error) throw new AppError(400, error);
  const org = await prisma.organization.update({
    where: { id: ctx.organizationId },
    data: { defaultLowStockThreshold: value },
  });
  return { defaultLowStockThreshold: org.defaultLowStockThreshold };
}
