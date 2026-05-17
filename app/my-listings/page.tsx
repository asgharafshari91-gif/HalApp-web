import MyListingsClient from "./ui/my-listings-client";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type ListingRow = any;

export default async function MyListingsPage() {
  const sb = await supabaseServer();

  const { data: u, error: uerr } = await sb.auth.getUser();
  const user = u?.user;

  if (uerr || !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">Giriş yapmalısın.</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Bu sayfayı görmek için hesabınla giriş yap.
          </div>
        </div>
      </div>
    );
  }

  // ✅ sağlam: select("*") -> kolon uyuşmazlığı yüzünden kırılmaz
  const { data: listings, error } = await sb
    .from("listings")
    .select("*")
    .eq("seller_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          İlanlar yüklenemedi: {error.message}
        </div>
      </div>
    );
  }

  // ✅ listing_media tablosu varsa otomatik bağla (yoksa sessizce geç)
  const merged = await attachListingMediaIfExists(sb, listings ?? []);

  // ✅ media_urls içindeki eleman path ise signed url üret (bucket private olsa bile çalışır)
  const final = await ensureMediaUrlsWork(sb, merged);

  return <MyListingsClient initialListings={final as any} />;
}

async function attachListingMediaIfExists(sb: any, listings: ListingRow[]) {
  if (!listings.length) return listings;

  const ids = listings.map((x) => x.id);

  const { data: mediaRows, error } = await sb
    .from("listing_media")
    .select("*")
    .in("listing_id", ids)
    .order("sort_order", { ascending: true });

  if (error) return listings; // tablo yok / izin yok

  const map = new Map<string, any[]>();
  for (const r of mediaRows ?? []) {
    const k = r.listing_id;
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(r);
  }

  return listings.map((it) => {
    const urls0 = Array.isArray(it.media_urls) ? it.media_urls : [];
    const types0 = Array.isArray(it.media_types) ? it.media_types : [];

    if (urls0.length > 0 && types0.length > 0) return it;

    const rows = map.get(it.id) ?? [];
    const urls = rows.map((x) => x.url || x.path).filter(Boolean);
    const types = rows.map((x) => (x.type === "video" ? "video" : "image")).filter(Boolean);

    if (urls0.length === 0 && urls.length > 0) {
      return { ...it, media_urls: urls, media_types: types };
    }

    return it;
  });
}

async function ensureMediaUrlsWork(sb: any, listings: ListingRow[]) {
  const out: ListingRow[] = [];

  for (const it of listings) {
    const urls: string[] = Array.isArray(it.media_urls) ? it.media_urls : [];
    const types: string[] = Array.isArray(it.media_types) ? it.media_types : [];

    const fixed: string[] = [];

    for (const u of urls) {
      if (!u) continue;
      const s = String(u);

      if (s.startsWith("http://") || s.startsWith("https://")) {
        fixed.push(s);
        continue;
      }

      const { data } = await sb.storage.from("listing_media").createSignedUrl(s, 60 * 60);
      if (data?.signedUrl) fixed.push(data.signedUrl);
    }

    out.push({ ...it, media_urls: fixed, media_types: types });
  }

  return out;
}