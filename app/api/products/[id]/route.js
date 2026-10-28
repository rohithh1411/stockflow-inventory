import { adjustStock, deleteProduct, getProduct, updateProduct } from "@/lib/inventory";
import { json, readJson, route } from "@/lib/route";

export const dynamic = "force-dynamic";

export const GET = route(async (_req, { params }, session) =>
  json({ product: await getProduct(session, params.id) })
);

// Full edit
export const PUT = route(async (req, { params }, session) =>
  json({ product: await updateProduct(session, params.id, await readJson(req)) })
);

// Quick stock adjustment: { "delta": 5 } or { "delta": -3 }
export const PATCH = route(async (req, { params }, session) => {
  const body = await readJson(req);
  return json({ product: await adjustStock(session, params.id, body.delta) });
});

export const DELETE = route(async (_req, { params }, session) => {
  await deleteProduct(session, params.id);
  return json({ ok: true });
});
