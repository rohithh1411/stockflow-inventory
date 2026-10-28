// Low stock rule from the PRD: quantity <= threshold.
// A product without its own threshold uses the organization's default.
export function effectiveThreshold(product, defaultThreshold) {
  return product.lowStockThreshold ?? defaultThreshold;
}

export function isLowStock(product, defaultThreshold) {
  return product.quantity <= effectiveThreshold(product, defaultThreshold);
}

// "out" (nothing left), "low" (at or below threshold), or "ok".
export function stockStatus(product, defaultThreshold) {
  if (product.quantity <= 0) return "out";
  return isLowStock(product, defaultThreshold) ? "low" : "ok";
}
