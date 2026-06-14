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

function hoursAgoISO(hours: number) {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

function avg(nums: number[]) {
  if (!nums.length) return null;
  return Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2));
}

function hoursBetween(a?: string | null, b?: string | null) {
  if (!a || !b) return null;

  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();

  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return null;

  return Math.max(0, (tb - ta) / 1000 / 60 / 60);
}

export async function GET() {
  const gate = await requireAdminOrRedirect("/admin/support");

  if (!gate.ok) {
    return json({ error: gate.reason ?? "not_allowed" }, 403);
  }

  const sb = await adminServerClient();

  const todayISO = startOfTodayISO();
  const last24ISO = hoursAgoISO(24);
  const sevenDaysAgoISO = daysAgoISO(6);

  const [
    openRes,
    closedRes,
    waitingRes,
    todayRes,
    last24Res,
    criticalRes,
    ratingRes,
    sevenDaysRes,
    categoryRes,
    kpiRowsRes,
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
      .gte("created_at", last24ISO),

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

    sb
      .from("support_tickets")
      .select(
        `
        id,
        status,
        priority,
        category,
        created_at,
        closed_at,
        last_admin_reply_at,
        last_user_reply_at,
        rating
      `
      ),
  ]);

  const ratings = (ratingRes.data ?? [])
    .map((x: any) => Number(x.rating))
    .filter((x) => Number.isFinite(x));

  const avgRating = avg(ratings);

  const fiveStarCount = ratings.filter((x) => x === 5).length;
  const fiveStarRate =
    ratings.length > 0
      ? Number(((fiveStarCount / ratings.length) * 100).toFixed(1))
      : null;

  const kpiRows = (kpiRowsRes.data ?? []) as any[];

  const resolutionHours = kpiRows
    .filter((x) => String(x.status ?? "").toLowerCase() === "closed")
    .map((x) => hoursBetween(x.created_at, x.closed_at))
    .filter((x): x is number => typeof x === "number" && Number.isFinite(x));

  const avgResolutionHours = avg(resolutionHours);

  const firstReplyHours = kpiRows
    .map((x) => hoursBetween(x.created_at, x.last_admin_reply_at))
    .filter((x): x is number => typeof x === "number" && Number.isFinite(x));

  const avgFirstReplyHours = avg(firstReplyHours);

  const openCount = openRes.count ?? 0;
  const closedCount = closedRes.count ?? 0;
  const totalResolvedBase = openCount + closedCount;

  const closeRate =
    totalResolvedBase > 0
      ? Number(((closedCount / totalResolvedBase) * 100).toFixed(1))
      : null;

  const categoryMap = new Map<string, number>();

  for (const row of categoryRes.data ?? []) {
    const key = String((row as any).category ?? "general").trim() || "general";
    categoryMap.set(key, (categoryMap.get(key) ?? 0) + 1);
  }

  const categories = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topCategory = categories[0] ?? null;

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

  return json({
    ok: true,
    stats: {
      open: openCount,
      closed: closedCount,
      waiting: waitingRes.count ?? 0,
      today: todayRes.count ?? 0,
      last24h: last24Res.count ?? 0,
      critical: criticalRes.count ?? 0,

      avgRating,
      ratingCount: ratings.length,
      fiveStarCount,
      fiveStarRate,

      avgResolutionHours,
      avgFirstReplyHours,
      closeRate,

      topCategory,
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