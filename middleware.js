import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getSecret } from "./lib/secret.js";

// Sends logged-out visitors to /login. The API routes also check the session
// themselves, so this is a convenience for pages, not the only defence.
export async function middleware(req) {
  const token = req.cookies.get("stockflow_token")?.value;
  const key = getSecret();
  let valid = false;
  if (token) {
    try {
      await jwtVerify(token, key);
      valid = true;
    } catch {
      valid = false;
    }
  }
  if (!valid) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/products/:path*", "/settings/:path*"],
};
