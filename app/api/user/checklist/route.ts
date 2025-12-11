import { auth } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";

export async function GET(req: Request) {
  // Authenticate
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  // Read query param
  const { searchParams } = new URL(req.url);
  const checklistId = searchParams.get("id");

  if (!checklistId) {
    return Response.json(
      { ok: false, error: "Missing checklist id" },
      { status: 400 }
    );
  }

  // Load checklist from KV
  const checklist = await kv.get(`kb:${userId}:${checklistId}:checklist`);

  if (!checklist) {
    return Response.json(
      { ok: false, error: "Checklist not found" },
      { status: 404 }
    );
  }

  return Response.json({
    ok: true,
    checklistId,
    checklist,
  });
}
