import { createProduct, listProducts } from "@/lib/inventory";
import { json, readJson, route } from "@/lib/route";

export const dynamic = "force-dynamic";

// GET /api/products?q=search  -> this organization's products
export const GET = route(async (req, _ctx, session) => {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return json({ products: await listProducts(session, { q }) });
});

export const POST = route(async (req, _ctx, session) => {
  const product = await createProduct(session, await readJson(req));
  return json({ product }, 201);
});
