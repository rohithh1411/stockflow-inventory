const MAX_INT = 2_000_000_000;
const MAX_PRICE = 1_000_000_000;
export const MAX_DELTA = 1_000_000;

function toNumber(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function wholeNumber(v, label, { required = false } = {}) {
  const n = toNumber(v);
  if (n === null) return required ? { error: `${label} is required` } : { value: null };
  if (Number.isNaN(n) || !Number.isInteger(n) || n < 0 || n > MAX_INT) {
    return { error: `${label} must be a whole number, 0 or more` };
  }
  return { value: n };
}

function price(v, label) {
  const n = toNumber(v);
  if (n === null) return { value: null };
  if (Number.isNaN(n) || n < 0 || n > MAX_PRICE) return { error: `${label} must be a number, 0 or more` };
  return { value: n };
}

// Returns { error } or { data }. SKUs are stored in upper case so that
// "pen-1" and "PEN-1" count as the same SKU.
export function parseProduct(body) {
  const name = String(body.name ?? "").trim();
  const sku = String(body.sku ?? "").trim().toUpperCase();
  const description = String(body.description ?? "").trim();

  if (!name) return { error: "Name is required" };
  if (name.length > 120) return { error: "Name must be 120 characters or fewer" };
  if (!sku) return { error: "SKU is required" };
  if (sku.length > 64) return { error: "SKU must be 64 characters or fewer" };
  if (description.length > 1000) return { error: "Description must be 1000 characters or fewer" };

  const quantity = toNumber(body.quantity) === null ? { value: 0 } : wholeNumber(body.quantity, "Quantity");
  if (quantity.error) return quantity;
  const costPrice = price(body.costPrice, "Cost price");
  if (costPrice.error) return costPrice;
  const sellingPrice = price(body.sellingPrice, "Selling price");
  if (sellingPrice.error) return sellingPrice;
  const threshold = wholeNumber(body.lowStockThreshold, "Low stock threshold");
  if (threshold.error) return threshold;

  return {
    data: {
      name,
      sku,
      description: description || null,
      quantity: quantity.value,
      costPrice: costPrice.value,
      sellingPrice: sellingPrice.value,
      lowStockThreshold: threshold.value,
    },
  };
}

export function parseThreshold(value) {
  const r = wholeNumber(value, "Default low stock threshold", { required: true });
  if (r.error) return r;
  if (r.value > 100000) return { error: "Default low stock threshold is too large" };
  return r;
}

export function parseDelta(value) {
  const n = toNumber(value);
  if (n === null || Number.isNaN(n) || !Number.isInteger(n) || n === 0 || Math.abs(n) > MAX_DELTA) {
    return { error: "Enter a whole number other than 0" };
  }
  return { value: n };
}
