"use client";
import { useState } from "react";
import Link from "next/link";

const empty = {
  name: "", sku: "", description: "", quantity: "0",
  costPrice: "", sellingPrice: "", lowStockThreshold: "",
};

export default function ProductForm({ initial, onSubmit, submitLabel }) {
  const [form, setForm] = useState({ ...empty, ...initial });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function handle(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handle} className="panel panel-pad" style={{ maxWidth: 680 }}>
      {error && <div className="alert-error">{error}</div>}

      <h2 className="section-title">Product details</h2>
      <div className="grid-2">
        <label className="field">Name
          <input className="input" value={form.name} onChange={set("name")} required />
        </label>
        <label className="field">SKU
          <span className="hint">Must be unique in your organization</span>
          <input className="input" value={form.sku} onChange={set("sku")} required />
        </label>
      </div>
      <label className="field">Description
        <span className="hint">Optional</span>
        <textarea className="input" rows={3} value={form.description} onChange={set("description")} />
      </label>

      <hr className="divider" />
      <h2 className="section-title">Stock</h2>
      <div className="grid-2">
        <label className="field">Quantity on hand
          <input className="input" type="number" min="0" step="1" value={form.quantity} onChange={set("quantity")} />
        </label>
        <label className="field">Low stock threshold
          <span className="hint">Leave blank to use the default from Settings</span>
          <input className="input" type="number" min="0" step="1" value={form.lowStockThreshold} onChange={set("lowStockThreshold")} />
        </label>
      </div>

      <hr className="divider" />
      <h2 className="section-title">Pricing</h2>
      <div className="grid-2">
        <label className="field">Cost price
          <input className="input" type="number" min="0" step="0.01" value={form.costPrice} onChange={set("costPrice")} />
        </label>
        <label className="field">Selling price
          <input className="input" type="number" min="0" step="0.01" value={form.sellingPrice} onChange={set("sellingPrice")} />
        </label>
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : submitLabel}</button>
        <Link href="/products" className="btn btn-quiet">Cancel</Link>
      </div>
    </form>
  );
}
