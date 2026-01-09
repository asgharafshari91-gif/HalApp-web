import Link from "next/link";
import { redirect } from "next/navigation";
import { adminServerClient, requireAdminOrRedirect } from "@/lib/admin";

export const dynamic = "force-dynamic";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function toInt(v: any, def: number) {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

function pageHref(q: string, page: number) {
  const p = new URLSearchParams();
  if (q.trim()) p.set("q", q.trim());
  if (page > 1) p.set("page", String(page));
  return `/admin/users?${p.toString()}`;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const gate = await requireAdminOrRedirect("/admin/users");
  if (!gate.ok) redirect(gate.redirectTo);

  const sp = await searchParams;

  const q = String(sp.q ?? "").trim();
  const page = Math.max(1, toInt(sp.page, 1));

  const limit = 25;
  const offset = (page - 1) * limit;
  const from = offset;
  const to = offset + limit - 1;

  const sb = await adminServerClient();

  // ✅ API fetch yok -> cookie / URL parse / not_authed yok
  // ✅ En güvenlisi: select("*") (kolon adları farklıysa patlamasın)
  let qb = sb
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    // Supabase .or() içinde virgül ayraçtır -> bozmasın diye temizliyoruz
    const esc = q.replace(/,/g, " ").trim();

    // id uuid -> id::text ile arama
    // full_name/company_name/phone/email varsa arar; yoksa PostgREST hata vermez çünkü select(*) ile var/yok ayrımı yok,
    // ama filter alanı yoksa hata verebilir. Eğer sizde bu kolonlardan bazıları yoksa alttaki satırdan onları çıkarın.
    qb = qb.or(
      [
        `id::text.ilike.%${esc}%`,
        `full_name.ilike.%${esc}%`,
        `company_name.ilike.%${esc}%`,
        `phone.ilike.%${esc}%`,
        `email.ilike.%${esc}%`,
      ].join(",")
    );
  }

  const { data, error, count } = await qb.range(from, to);

  if (error) {
    return (
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-lg font-black">👤 Kullanıcılar</div>
        <div className="mt-2 text-sm text-rose-600 dark:text-rose-400">API Hatası: {error.message}</div>
      </div>
    );
  }

  const items = (data ?? []) as any[];
  const total = Number(count ?? 0);
  const pages = Math.max(1, Math.ceil(total / limit));

  // ✅ page çok büyükse son sayfaya çek
  if (page > pages) redirect(pageHref(q, pages));

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-lg font-black">👤 Kullanıcılar ({total})</div>

        <div className="mt-2 flex gap-2">
          <form method="get" action="/admin/users" className="flex w-full gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="İsim / şirket / id / telefon / email ara…"
              className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-black/30"
            />
            <button
              className={clsx(
                "rounded-2xl bg-black/10 px-4 py-3 text-sm font-black hover:bg-black/15",
                "dark:bg-white/10 dark:hover:bg-white/15"
              )}
            >
              Ara
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-[22px] border border-black/10 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="grid gap-2">
          {items.map((u: any) => {
            const name = String(u.company_name ?? u.full_name ?? "—");
            const id = String(u.id ?? "");

            const premium = !!u.is_premium;
            const isAdmin = !!u.is_admin;

            const banned =
              !!u.banned_until && new Date(String(u.banned_until)).getTime() > Date.now();

            return (
              <Link
                key={id}
                href={`/admin/users/${encodeURIComponent(id)}`}
                className={clsx(
                  "rounded-2xl border border-black/10 bg-white/70 px-4 py-3 hover:bg-white",
                  "dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black">{name}</div>
                    <div className="truncate text-xs text-black/60 dark:text-white/60">{id}</div>
                    {(u.phone || u.email) ? (
                      <div className="truncate text-xs text-black/50 dark:text-white/50">
                        {u.phone ? `tel: ${u.phone}` : ""}
                        {u.email ? ` • mail: ${u.email}` : ""}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex gap-2 text-xs font-black">
                    {isAdmin ? <span className="rounded-full bg-indigo-500/20 px-2 py-1">ADMIN</span> : null}
                    {premium ? <span className="rounded-full bg-emerald-500/20 px-2 py-1">PREMIUM</span> : null}
                    {banned ? <span className="rounded-full bg-rose-500/20 px-2 py-1">BAN</span> : null}
                  </div>
                </div>
              </Link>
            );
          })}

          {items.length === 0 ? (
            <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-6 text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
              Kayıt bulunamadı.
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between px-2 text-sm">
          <div className="text-black/60 dark:text-white/60">
            Sayfa {page}/{pages} • toplam {total}
          </div>

          <div className="flex gap-2">
            <Link
              aria-disabled={page <= 1}
              className={clsx(
                "rounded-xl bg-black/10 px-3 py-2 font-black hover:bg-black/15",
                "dark:bg-white/10 dark:hover:bg-white/15",
                page <= 1 ? "pointer-events-none opacity-50" : ""
              )}
              href={pageHref(q, Math.max(1, page - 1))}
            >
              ←
            </Link>

            <Link
              aria-disabled={page >= pages}
              className={clsx(
                "rounded-xl bg-black/10 px-3 py-2 font-black hover:bg-black/15",
                "dark:bg-white/10 dark:hover:bg-white/15",
                page >= pages ? "pointer-events-none opacity-50" : ""
              )}
              href={pageHref(q, Math.min(pages, page + 1))}
            >
              →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}