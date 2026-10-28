import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getSecret } from "./secret.js";

export const COOKIE = "stockflow_token";

export async function createToken(user) {
  return new SignJWT({ userId: user.id, organizationId: user.organizationId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export function setAuthCookie(token) {
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie() {
  cookies().delete(COOKIE);
}

// Returns { userId, organizationId } or null.
// organizationId always comes from the signed token, never from the request,
// which is what keeps one organization's data away from another's.
export async function getSession() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const key = getSecret(); // outside try/catch: a missing secret should be loud
  try {
    const { payload } = await jwtVerify(token, key);
    return { userId: payload.userId, organizationId: payload.organizationId };
  } catch {
    return null;
  }
}
