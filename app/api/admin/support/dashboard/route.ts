// app/api/admin/support/dashboard/route.ts
import { NextResponse } from "next/server";
import { adminServerClient, requireAdminOrRedirect } from "@/lib/admin";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function GET() {
  const gate = await requireAdminOrRedirect("/admin/support");

  if (!gate.ok) {
    return json({ error: gate.reason ?? "not_allowed" }, 403);
  }

  const sb = await adminServerClient();

  const todayISO = startOfTodayISO();
  const sevenDaysAgoISO = daysAgoISO(6);

  const [
    openRes,
    closedRes,
    waitingRes,
    todayRes,
    criticalRes,
    ratingRes,
    sevenDaysRes,
    categoryRes,
  ] = await Promise.all([
    sb
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),

    sb
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "closed"),

    sb
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .gt("unread_admin_count", 0),

    sb
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayISO),

    sb
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("priority", "critical"),

    sb
      .from("support_tickets")
      .select("rating")
      .not("rating", "is", null),

    sb
      .from("support_tickets")
      .select("created_at")
      .gte("created_at", sevenDaysAgoISO),

    sb
      .from("support_tickets")
      .select("category"),
  ]);

  const ratings = (ratingRes.data ?? [])
    .map((x: any) => Number(x.rating))
    .filter((x) => Number.isFinite(x));

  const avgRating =
    ratings.length > 0
      ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2))
      : null;

  const dayMap = new Map<string, number>();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);

    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, 0);
  }

  for (const row of sevenDaysRes.data ?? []) {
    const key = String((row as any).created_at ?? "").slice(0, 10);
    if (dayMap.has(key)) {
      dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    }
  }

  const categoryMap = new Map<string, number>();

  for (const row of categoryRes.data ?? []) {
    const key = String((row as any).category ?? "general").trim() || "general";
    categoryMap.set(key, (categoryMap.get(key) ?? 0) + 1);
  }

  const categories = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return json({
    ok: true,
    stats: {
      open: openRes.count ?? 0,
      closed: closedRes.count ?? 0,
      waiting: waitingRes.count ?? 0,
      today: todayRes.count ?? 0,
      critical: criticalRes.count ?? 0,
      avgRating,
      ratingCount: ratings.length,
    },
    charts: {
      last7Days: Array.from(dayMap.entries()).map(([date, count]) => ({
        date,
        count,
      })),
      categories,
    },
  });
}