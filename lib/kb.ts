import { kv } from "@vercel/kv";

export async function saveKB(items: any[]) {
  await kv.set("kb:checklist", items);
}

export async function loadKB() {
  return await kv.get("kb:checklist");
}

export async function deleteKB() {
  await kv.del("kb:checklist");
}
