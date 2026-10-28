import { getDashboard } from "@/lib/inventory";
import { json, route } from "@/lib/route";

export const dynamic = "force-dynamic";

export const GET = route(async (_req, _ctx, session) => json(await getDashboard(session)));
