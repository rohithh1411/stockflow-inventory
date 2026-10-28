"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import ConfirmDialog from "@/components/ConfirmDialog";

const SORTS = {
  newest: null, // keep the order the server sends (newest first)
  name: (a, b) => a.name.localeCompare(b.name),
  qtyAsc: (a, b) => a.quantity - b.quantity,
  qtyDesc: (a, b) => b.quantity - a.quantity,
};

const STATUS_LABEL = { ok: "In stock", low: "Low", out: "Out of stock" };

export default function ProductsPage() {
  const [products, setProducts] = useState(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest");
  const [lowOnly, setLowOnly] = useState(false);
  const [deltas, setDeltas] = useState({});
  const [toDelete, setToDelete] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api(`/api/products?q=${encodeURIComponent(q)}`);
      setProducts(data.products);
    } catch (e) {
      setError(e.message);
    }
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    if (!products) return null;
    const list = lowOnly ? products.filter((p) => p.isLowStock) : products;
    return SORTS[sort] ? [...list].sort(SORTS[sort]) : list;
  }, [products, lowOnly, sort]);

  async function confirmDelete() {
    const p = toDelete;
    setToDelete(null);
    setError("");
    try {
      await api(`/api/products/${p.id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function adjust(p) {
    setError("");
    try {
      await api(`/api/products/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({ delta: deltas[p.id] }),
      });
      setDeltas({ ...deltas, [p.id]: "" });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-sub">
            {products ? `${products.length} ${products.length === 1 ? "product" : "products"}` : "Everything you stock, with live quantities."}
          </p>
        </div>
        <Link href="/products/new" className="btn btn-primary">Add product</Link>
      </div>

      <div className="toolbar">
        <input
          className="input grow"
          placeholder="Search by name or SKU"
          aria-label="Search by name or SKU"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input" aria-label="Sort products" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="name">Name A to Z</option>
          <option value="qtyAsc">Quantity, low to high</option>
          <option value="qtyDesc">Quantity, high to low</option>
        </select>
        <label className="check">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
          Low stock only
        </label>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="panel">
        {!visible ? (
          <div className="empty"><p>Loading...</p></div>
        ) : products.length === 0 ? (
          q ? (
            <div className="empty">
              <h3>No matches</h3>
              <p>No product matches &quot;{q}&quot;. Try a different name or SKU.</p>
            </div>
          ) : (
            <div className="empty">
              <h3>No products yet</h3>
              <p>Add your first product to start tracking stock.</p>
              <Link href="/products/new" className="btn btn-primary">Add product</Link>
            </div>
          )
        ) : visible.length === 0 ? (
          <div className="empty">
            <h3>Nothing is running low</h3>
            <p>Every product is above its low stock threshold.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th className="num">Quantity</th>
                  <th>Stock</th>
                  <th className="num">Selling price</th>
                  <th>Adjust stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id}>
                    <td className="cell-name">
                      {p.name}
                      <span className="cell-sub">
                        Updated {new Date(p.updatedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                      </span>
                    </td>
                    <td className="cell-sku">{p.sku}</td>
                    <td className="num">{p.quantity.toLocaleString()}</td>
                    <td><span className={`pill ${p.status}`}>{STATUS_LABEL[p.status]}</span></td>
                    <td className="num">{p.sellingPrice != null ? Number(p.sellingPrice).toFixed(2) : "-"}</td>
                    <td>
                      <div className="adjust">
                        <input
                          type="number"
                          step="1"
                          placeholder="+5 or -3"
                          aria-label={`Adjust stock for ${p.name}`}
                          value={deltas[p.id] ?? ""}
                          onChange={(e) => setDeltas({ ...deltas, [p.id]: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && deltas[p.id] && adjust(p)}
                        />
                        <button className="btn btn-quiet btn-sm" disabled={!deltas[p.id]} onClick={() => adjust(p)}>
                          Apply
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link href={`/products/${p.id}`} className="btn btn-quiet btn-sm">Edit</Link>
                        <button className="btn btn-danger btn-sm" onClick={() => setToDelete(p)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this product?"
        message={toDelete ? `"${toDelete.name}" (${toDelete.sku}) will be removed permanently.` : ""}
        confirmLabel="Delete product"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
