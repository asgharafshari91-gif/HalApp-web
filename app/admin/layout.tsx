// app/admin/layout.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminOrRedirect } from "@/lib/admin";

export const dynamic = "force-dynamic";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function NavItem({
  href,
  label,
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "block rounded-2xl px-4 py-3 text-sm font-extrabold transition",
        "border border-black/10 bg-white/70 hover:bg-white",
        "dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]",
        active && "ring-2 ring-emerald-500/30 border-emerald-500/30"
      )}
    >
      {label}
    </Link>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const g = await requireAdminOrRedirect("/admin");
  if (!g.ok) redirect(g.redirectTo);

  // ✅ basit active belirleme: path server component’te yok.
  // active highlight için istersen client sidebar yaparız.
  // Şimdilik sade bırakıyoruz.

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6">
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3">
          <div className="rounded-[28px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-black">Admin Panel</div>
                <div className="mt-1 text-sm text-black/60 dark:text-white/60">
                  Kullanıcı, KYC, Destek, Ban ve Premium yönetimi.
                </div>
              </div>

              <Link
                href="/"
                className="rounded-2xl border border-black/10 bg-black/5 px-3 py-2 text-xs font-extrabold text-black/75 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10"
              >
                ← Site
              </Link>
            </div>
          </div>

          <div className="space-y-2">
            <NavItem href="/admin" label="📊 Dashboard" />
            <NavItem href="/admin/users" label="👤 Kullanıcılar" />
            <NavItem href="/admin/kyc" label="🪪 KYC Talepleri" />
            <NavItem href="/admin/support" label="🎫 Destek Talepleri" />
            <div className="my-2 h-px bg-black/10 dark:bg-white/10" />
            <NavItem href="/admin/audit" label="🔒 Admin Audit Log" />
          </div>

          <div className="rounded-[22px] border border-black/10 bg-black/5 p-4 text-xs text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60 leading-6">
            <b>Not:</b> Admin sayfalar cookie ile auth okuduğu için <code>dynamic = "force-dynamic"</code> açık.
          </div>
        </aside>

        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}