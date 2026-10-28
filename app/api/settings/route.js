import { getSettings, updateSettings } from "@/lib/inventory";
import { json, readJson, route } from "@/lib/route";

export const dynamic = "force-dynamic";

export const GET = route(async (_req, _ctx, session) => json(await getSettings(session)));

export const PUT = route(async (req, _ctx, session) =>
  json(await updateSettings(session, await readJson(req)))
);
