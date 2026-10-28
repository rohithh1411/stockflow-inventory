import { test } from "node:test";
import assert from "node:assert/strict";
import { effectiveThreshold, isLowStock, stockStatus } from "../lib/stock.js";
import { parseProduct, parseDelta, parseThreshold } from "../lib/validate.js";

test("a product's own threshold beats the organization default", () => {
  assert.equal(effectiveThreshold({ lowStockThreshold: 10 }, 5), 10);
  assert.equal(effectiveThreshold({ lowStockThreshold: null }, 5), 5);
  assert.equal(effectiveThreshold({ lowStockThreshold: 0 }, 5), 0);
});

test("low stock means quantity at or below the threshold", () => {
  assert.equal(isLowStock({ quantity: 5, lowStockThreshold: null }, 5), true);
  assert.equal(isLowStock({ quantity: 6, lowStockThreshold: null }, 5), false);
  assert.equal(isLowStock({ quantity: 8, lowStockThreshold: 10 }, 5), true);
});

test("status is out, low or ok", () => {
  assert.equal(stockStatus({ quantity: 0, lowStockThreshold: null }, 5), "out");
  assert.equal(stockStatus({ quantity: 3, lowStockThreshold: null }, 5), "low");
  assert.equal(stockStatus({ quantity: 50, lowStockThreshold: null }, 5), "ok");
});

test("parseProduct trims, upper-cases the SKU and fills defaults", () => {
  const { data, error } = parseProduct({ name: "  Pen ", sku: " pen-1 ", sellingPrice: "9.5" });
  assert.equal(error, undefined);
  assert.deepEqual(data, {
    name: "Pen", sku: "PEN-1", description: null, quantity: 0,
    costPrice: null, sellingPrice: 9.5, lowStockThreshold: null,
  });
});

test("parseProduct rejects bad input with a clear message", () => {
  assert.match(parseProduct({ name: "", sku: "A" }).error, /Name is required/);
  assert.match(parseProduct({ name: "A", sku: "" }).error, /SKU is required/);
  assert.match(parseProduct({ name: "A", sku: "A", quantity: "-1" }).error, /Quantity/);
  assert.match(parseProduct({ name: "A", sku: "A", quantity: "2.5" }).error, /Quantity/);
  assert.match(parseProduct({ name: "A", sku: "A", quantity: "abc" }).error, /Quantity/);
  assert.match(parseProduct({ name: "A", sku: "A", sellingPrice: "-3" }).error, /Selling price/);
  assert.match(parseProduct({ name: "A", sku: "A", lowStockThreshold: "1.5" }).error, /threshold/);
  assert.match(parseProduct({ name: "x".repeat(121), sku: "A" }).error, /Name/);
});

test("parseDelta accepts whole non-zero numbers only", () => {
  assert.equal(parseDelta("5").value, 5);
  assert.equal(parseDelta(-3).value, -3);
  assert.ok(parseDelta(0).error);
  assert.ok(parseDelta("").error);
  assert.ok(parseDelta("1.5").error);
  assert.ok(parseDelta(10_000_000).error);
});

test("parseThreshold requires a whole number, 0 or more", () => {
  assert.equal(parseThreshold("0").value, 0);
  assert.equal(parseThreshold("12").value, 12);
  assert.ok(parseThreshold("").error);
  assert.ok(parseThreshold("-1").error);
  assert.ok(parseThreshold("2.5").error);
});
