// app/api/pazar/[id]/view/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
  { auth: { persistSession: false } }
);

function safeId(v: any) {
  return String(v ?? "").trim();
}

async function getViews(listingId: string): Promise<number | null> {
  try {
    const { data, error } = await supabase.rpc("get_listing_views", { ids: [listingId] });
    if (error) throw error;
    const r = (data ?? [])[0];
    return r ? (Number(r.views ?? 0) || 0) : 0;
  } catch {
    return null;
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {

  const { id } = await params;

  const safeListingId = safeId(id);

  if (!safeListingId) {
    return NextResponse.json(
      { error: "missing_id" },
      { status: 400 }
    );
  }

  try {
    // (Opsiyonel) Bot spam azaltmak için basit kontrol
    // const ua = req.headers.get("user-agent") || "";
    // if (!ua) return NextResponse.json({ error: "missing_ua" }, { status: 400 });

    // ✅ view +1
    try {
      const { error } = await supabase.rpc("increment_listing_view", { listing_id: safeListingId });
      if (error) throw error;
    } catch {
      // RPC yoksa / izin yoksa: sessiz geç (istersen burada 500 döndürebilirsin)
      return NextResponse.json({ ok: false, error: "increment_failed" }, { status: 500 });
    }

    const views = await getViews(id);
    return NextResponse.json({ ok: true, listing_id: id, views });
  } catch (e: any) {
    return NextResponse.json(
      { error: "server_error", message: e?.message ? String(e.message) : "unknown_error" },
      { status: 500 }
    );
  }
}