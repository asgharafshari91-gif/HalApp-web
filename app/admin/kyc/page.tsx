// app/admin/kyc/page.tsx
import { redirect } from "next/navigation";
import { requireAdminOrRedirect, adminServerClient } from "@/lib/admin";
import KycClient from "@/app/admin/ui/kyc-client";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(v: string | string[] | undefined, fallback = "") {
  if (Array.isArray(v)) return String(v[0] ?? fallback);
  return String(v ?? fallback);
}

function toInt(v: any, def: number) {
  const n = Number(v ?? "");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

function escLike(s: string) {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/,/g, " ");
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function normalizeStatus(v: string) {
  const s = String(v || "pending").trim().toLowerCase();
  if (["pending", "approved", "rejected", "all"].includes(s)) return s;
  return "pending";
}

function pageUrl({
  q,
  status,
  limit,
  page,
}: {
  q: string;
  status: string;
  limit: number;
  page: number;
}) {
  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  if (status && status !== "pending") sp.set("status", status);
  if (limit !== 25) sp.set("limit", String(limit));
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return `/admin/kyc${qs ? `?${qs}` : ""}`;
}

function ErrorBox({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-[26px] border border-rose-500/30 bg-rose-500/10 p-6 shadow-sm">
      <div className="text-lg font-black text-rose-700 dark:text-rose-200">{title}</div>
      <div className="mt-2 text-sm font-semibold text-rose-700/80 dark:text-rose-200/80">
        {message}
      </div>
    </div>
  );
}

export default async function AdminKycPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const gate = await requireAdminOrRedirect("/admin/kyc");
  if (!gate.ok) redirect(gate.redirectTo);

  const sp = (await searchParams) ?? {};

  const q = firstParam(sp.q).trim();
  const status = normalizeStatus(firstParam(sp.status, "pending"));
  const limit = Math.min(100, Math.max(1, toInt(firstParam(sp.limit), 25)));
  const page = Math.max(1, toInt(firstParam(sp.page), 1));

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const sb = await adminServerClient();

  let qb = sb
    .from("kyc_requests")
    .select("*", { count: "exact" })
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false });

  if (status !== "all") {
    qb = qb.eq("status", status);
  }

  if (q) {
    if (isUuid(q)) {
      qb = qb.or(`id.eq.${q},user_id.eq.${q}`);
    } else {
      const qq = escLike(q);

      const { data: profileMatches, error: profileError } = await sb
        .from("profiles")
        .select("id")
        .or(
          [
            `full_name.ilike.%${qq}%`,
            `company_name.ilike.%${qq}%`,
            `email.ilike.%${qq}%`,
            `phone.ilike.%${qq}%`,
          ].join(",")
        )
        .limit(250);

      if (profileError) {
        return <ErrorBox title="🪪 KYC Talepleri" message={`Profil arama hatası: ${profileError.message}`} />;
      }

      const ids = (profileMatches ?? []).map((p: any) => p.id).filter(Boolean);

      if (ids.length === 0) {
        return (
          <KycClient
            initialItems={[]}
            q={q}
            status={status}
            page={page}
            pages={1}
            total={0}
            limit={limit}
          />
        );
      }

      qb = qb.in("user_id", ids);
    }
  }

  const { data, error, count } = await qb.range(from, to);

  if (error) {
    return <ErrorBox title="🪪 KYC Talepleri" message={`KYC sorgu hatası: ${error.message}`} />;
  }

  const rows = data ?? [];
  const userIds = [...new Set(rows.map((x: any) => x.user_id).filter(Boolean))];

  const profileMap: Record<string, any> = {};

  if (userIds.length) {
    const { data: profilesData, error: profilesError } = await sb
      .from("profiles")
      .select("id,full_name,company_name,phone,email,avatar_url,city,district,role,kyc_status,is_premium,verified")
      .in("id", userIds);

    if (profilesError) {
      return <ErrorBox title="🪪 KYC Talepleri" message={`Profil eşleştirme hatası: ${profilesError.message}`} />;
    }

    for (const profile of profilesData ?? []) {
      profileMap[profile.id] = profile;
    }
  }

  const items = rows.map((row: any) => ({
    ...row,
    profiles: row.user_id ? profileMap[row.user_id] ?? null : null,
  }));

  const total = Number(count ?? 0);
  const pages = Math.max(1, Math.ceil(total / limit));

  if (page > pages) {
    redirect(pageUrl({ q, status, limit, page: pages }));
  }

  return (
    <KycClient
      initialItems={items as any}
      q={q}
      status={status}
      page={page}
      pages={pages}
      total={total}
      limit={limit}
    />
  );
}