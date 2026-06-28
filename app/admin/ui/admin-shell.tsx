"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminGlobalSearch from "./admin-global-search";
import AdminNotificationBell from "./admin-notification-bell";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

const nav = [
  { href: "/admin", label: "📊 Dashboard", desc: "Genel operasyon" },
  { href: "/admin/users", label: "👤 Kullanıcılar", desc: "Profil ve yetki" },
  { href: "/admin/kyc", label: "🪪 KYC Merkezi", desc: "Kimlik doğrulama" },
  { href: "/admin/support", label: "🎫 Destek", desc: "Ticket yönetimi" },
  { href: "/admin/consents", label: "✅ Onaylar", desc: "KVKK / izinler" },
  { href: "/admin/audit", label: "🔒 Audit Log", desc: "İşlem geçmişi" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

function currentTitle(pathname: string) {
  const item = nav
    .slice()
    .sort((a, b) => b.href.length - a.href.length)
    .find((n) => isActive(pathname, n.href));

  return item?.label ?? "HalApp Admin";
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-black dark:bg-[#070907] dark:text-white">
      <div className="mx-auto w-full max-w-[1500px] px-4 pb-16 pt-5">
        <header className="mb-4 overflow-visible rounded-[30px] border border-black/10 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-800 dark:text-emerald-200">
                🟢 HalApp Admin Console
              </div>

              <div className="mt-2 flex flex-wrap items-end gap-2">
                <div className="text-2xl font-black tracking-tight">
                  {currentTitle(pathname)}
                </div>

                <div className="pb-1 text-xs font-semibold text-black/45 dark:text-white/45">
                  {pathname}
                </div>
              </div>

              <div className="mt-1 text-sm font-semibold text-black/55 dark:text-white/55">
                Kullanıcı, KYC, destek, güvenlik ve operasyon yönetimi.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <AdminGlobalSearch />
              <AdminNotificationBell />

              <Link
                href="/"
                className="rounded-2xl border border-black/10 bg-black px-4 py-3 text-xs font-black text-white hover:opacity-90 dark:border-white/10 dark:bg-white dark:text-black"
              >
                ← Siteye Dön
              </Link>
            </div>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <aside className="lg:sticky lg:top-5 lg:h-fit">
            <div className="overflow-hidden rounded-[30px] border border-black/10 bg-white/85 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
              <div className="border-b border-black/10 p-4 dark:border-white/10">
                <div className="text-xs font-black uppercase tracking-wider text-black/45 dark:text-white/45">
                  Yönetim Menüsü
                </div>

                <div className="mt-2 text-lg font-black">HalApp</div>

                <div className="mt-1 text-xs font-semibold leading-5 text-black/50 dark:text-white/50">
                  Dijital Toptancı Hali admin operasyon paneli.
                </div>
              </div>

              <nav className="grid gap-2 p-3">
                {nav.map((n) => {
                  const active = isActive(pathname, n.href);

                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      className={clsx(
                        "group rounded-2xl border px-4 py-3 transition",
                        "border-black/10 bg-white/60 hover:bg-white",
                        "dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]",
                        active &&
                          "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 ring-2 ring-emerald-500/15 dark:text-emerald-200"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-black">{n.label}</div>
                          <div className="mt-1 text-[11px] font-semibold text-black/45 dark:text-white/45">
                            {n.desc}
                          </div>
                        </div>

                        <div
                          className={clsx(
                            "text-xs font-black opacity-0 transition group-hover:opacity-100",
                            active && "opacity-100"
                          )}
                        >
                          →
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-black/10 p-3 dark:border-white/10">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs leading-6 text-black/65 dark:text-white/65">
                  <b className="text-black dark:text-white">Admin güvenliği:</b>
                  <br />
                  Kritik işlemler audit log’a yazılmalı. Ban, premium ve KYC işlemlerinde dikkatli ol.
                </div>
              </div>
            </div>
          </aside>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}