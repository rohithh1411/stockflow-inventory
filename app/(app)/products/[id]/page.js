"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ProductForm from "@/components/ProductForm";
import { api } from "@/lib/client";

// API returns null for empty fields; inputs need "".
function toForm(p) {
  return {
    name: p.name,
    sku: p.sku,
    description: p.description ?? "",
    quantity: String(p.quantity),
    costPrice: p.costPrice ?? "",
    sellingPrice: p.sellingPrice ?? "",
    lowStockThreshold: p.lowStockThreshold ?? "",
  };
}

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [initial, setInitial] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/api/products/${id}`)
      .then((d) => setInitial(toForm(d.product)))
      .catch((e) => setError(e.message));
  }, [id]);

  async function save(form) {
    await api(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(form) });
    router.push("/products");
    router.refresh();
  }

  if (error) return <div className="alert-error">{error}</div>;
  if (!initial) return <p className="page-sub">Loading...</p>;

  return (
    <>
      <div className="page-head">
        <div>
          <Link href="/products" className="back">Back to products</Link>
          <h1 className="page-title">Edit product</h1>
        </div>
      </div>
      <ProductForm initial={initial} onSubmit={save} submitLabel="Save changes" />
    </>
  );
}
