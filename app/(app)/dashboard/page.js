"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";

// Full bar means the product is right at its threshold; empty means out of stock.
const fill = (qty, threshold) => (threshold > 0 ? Math.min(100, Math.round((qty / threshold) * 100)) : 0);

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/dashboard").then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert-error">{error}</div>;
  if (!data) return <p className="page-sub">Loading...</p>;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Stock overview for {data.organizationName}</p>
        </div>
        <Link href="/products/new" className="btn btn-primary">Add product</Link>
      </div>

      <div className="dash">
        <section className="panel">
          <div className="panel-head">
            <h2>Low stock items</h2>
            {data.lowStock.length > 0 && <span className="pill low">{data.lowStock.length} to restock</span>}
          </div>
          {data.lowStock.length === 0 ? (
            <div className="empty">
              <h3>Everything is stocked</h3>
              <p>No product is at or below its low stock threshold.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>SKU</th>
                    <th className="num">Quantity on hand</th>
                    <th className="num">Low stock threshold</th>
                    <th>Level</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lowStock.map((p) => (
                    <tr key={p.id}>
                      <td className="cell-name"><Link href={`/products/${p.id}`}>{p.name}</Link></td>
                      <td className="cell-sku">{p.sku}</td>
                      <td className="num">{p.quantity.toLocaleString()}</td>
                      <td className="num">{p.threshold.toLocaleString()}</td>
                      <td style={{ minWidth: 110 }}>
                        <div className="level" role="img" aria-label={`${p.quantity} on hand, threshold ${p.threshold}`}>
                          <i style={{ width: `${fill(p.quantity, p.threshold)}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Inventory</h2></div>
          <div className="sum-row"><span>Products</span><span className="sum-val">{data.totalProducts.toLocaleString()}</span></div>
          <div className="sum-row"><span>Units on hand</span><span className="sum-val">{data.totalUnits.toLocaleString()}</span></div>
          <div className="sum-row"><span>Low stock items</span><span className="sum-val">{data.lowStock.length.toLocaleString()}</span></div>
          <div className="panel-foot"><Link href="/settings">Change default threshold</Link></div>
        </section>
      </div>
    </>
  );
}
