import { auth } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const keys = await kv.keys(`kb:${userId}:*:meta`);

  const items = [];
  for (const key of keys) {
    const meta: Record<string, string | number> | null = await kv.get(key);
    const checklistId = key.split(":")[2];
    items.push({ checklistId, ...meta });
  }

  return Response.json({ ok: true, items });
}
