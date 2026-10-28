import { clearAuthCookie } from "@/lib/auth";
import { json, route } from "@/lib/route";

export const POST = route(async () => {
  clearAuthCookie();
  return json({ ok: true });
}, { auth: false });
