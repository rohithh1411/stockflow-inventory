import { NextResponse } from "next/server";
import { getSession } from "./auth.js";
import { AppError } from "./errors.js";

export const json = (body, status = 200) => NextResponse.json(body, { status });

export async function readJson(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    throw new AppError(400, "Invalid request body");
  }
  if (!body || typeof body !== "object") throw new AppError(400, "Invalid request body");
  return body;
}

// Wraps an API handler: checks the login (unless auth: false), turns AppError
// into the right status code, and hides unexpected errors behind a plain 500.
export function route(handler, { auth = true } = {}) {
  return async (req, ctx) => {
    try {
      let session = null;
      if (auth) {
        session = await getSession();
        if (!session) return json({ error: "Unauthorized" }, 401);
      }
      return await handler(req, ctx, session);
    } catch (e) {
      if (e instanceof AppError) return json({ error: e.message }, e.status);
      console.error(e);
      return json({ error: "Something went wrong. Please try again." }, 500);
    }
  };
}
