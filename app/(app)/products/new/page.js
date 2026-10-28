"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProductForm from "@/components/ProductForm";
import { api } from "@/lib/client";

export default function NewProductPage() {
  const router = useRouter();

  async function create(form) {
    await api("/api/products", { method: "POST", body: JSON.stringify(form) });
    router.push("/products");
    router.refresh();
  }

  return (
    <>
      <div className="page-head">
        <div>
          <Link href="/products" className="back">Back to products</Link>
          <h1 className="page-title">Add product</h1>
        </div>
      </div>
      <ProductForm onSubmit={create} submitLabel="Create product" />
    </>
  );
}
