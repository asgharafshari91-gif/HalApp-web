import { supabase } from "@/lib/supabaseClient";

type CacheItem = { url: string; exp: number };
const cache = new Map<string, CacheItem>();

export async function getSignedMediaUrl(path: string, expiresInSec = 60 * 30) {
  const now = Date.now();
  const hit = cache.get(path);
  if (hit && hit.exp - now > 20_000) return hit.url; // 20sn kalana kadar cache

  const { data, error } = await supabase.storage
    .from("chat_media")
    .createSignedUrl(path, expiresInSec);

  if (error) throw error;

  const url = data.signedUrl;
  cache.set(path, { url, exp: now + expiresInSec * 1000 });
  return url;
}