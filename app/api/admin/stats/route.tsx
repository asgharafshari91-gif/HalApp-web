// app/api/admin/stats/route.ts
import { NextResponse } from "next/server";
import { adminServerClient, requireAdminOrRedirect } from "@/lib/admin";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

async function guardAdmin() {
  const g = await requireAdminOrRedirect("/admin");
  if (!g.ok) return { ok: false as const, res: json({ error: g.reason ?? "not_allowed" }, 403) };
  return { ok: true as const };
}

/**
 * GET /api/admin/stats?days=30
 * returns: daily_signups, premium_ratio
 */
export async function GET(req: Request) {
  const gate = await guardAdmin();
  if (!gate.ok) return gate.res;

  const url = new URL(req.url);
  const days = Math.min(180, Math.max(7, Number(url.searchParams.get("days") ?? "30")));

  const sb = await adminServerClient();

  // 전체 premium oranı
  const { count: totalUsers } = await sb.from("profiles").select("id", { count: "exact", head: true });
  const { count: totalPremium } = await sb
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_premium", true);

  // günlük kayıt: created_at üzerinden (profiles.created_at olmalı)
  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

  const { data: rows, error } = await sb
    .from("profiles")
    .select("created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  if (error) return json({ error: error.message }, 400);

  // gün bazında grupla
  const map = new Map<string, number>();
  for (const r of rows ?? []) {
    const d = new Date((r as any).created_at);
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  const daily_signups = Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));

  const premium_ratio =
    (totalUsers ?? 0) > 0 ? Math.round(((totalPremium ?? 0) / (totalUsers ?? 0)) * 1000) / 10 : 0;

  return json(
    {
      days,
      total_users: totalUsers ?? 0,
      total_premium: totalPremium ?? 0,
      premium_ratio, // %
      daily_signups,
    },
    200
  );
}