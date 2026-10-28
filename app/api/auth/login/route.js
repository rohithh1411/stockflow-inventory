import { verifyLogin } from "@/lib/accounts";
import { createToken, setAuthCookie } from "@/lib/auth";
import { json, readJson, route } from "@/lib/route";

export const POST = route(async (req) => {
  const user = await verifyLogin(await readJson(req));
  setAuthCookie(await createToken(user));
  return json({ ok: true });
}, { auth: false });
