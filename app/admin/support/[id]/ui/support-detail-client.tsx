"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function fmt(dt?: string | null) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return dt;
  }
}

function initials(name?: string | null) {
  const v = (name ?? "").trim();
  if (!v) return "HA";
  return (
    v
      .split(/\s+/)
      .slice(0, 2)
      .map((x) => x[0]?.toUpperCase())
      .join("") || "HA"
  );
}

function statusLabel(status?: string | null) {
  return String(status ?? "open").toLowerCase() === "closed" ? "Kapalı" : "Açık";
}

function statusClass(status?: string | null) {
  return String(status ?? "open").toLowerCase() === "closed"
    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
    : "border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-200";
}

function kycLabel(v?: string | null) {
  const s = String(v ?? "").toLowerCase();
  if (s === "approved" || s === "verified") return "KYC Onaylı";
  if (s === "pending") return "KYC İncelemede";
  if (s === "rejected") return "KYC Reddedildi";
  return "KYC Yok";
}

function kycClass(v?: string | null) {
  const s = String(v ?? "").toLowerCase();
  if (s === "approved" || s === "verified") {
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200";
  }
  if (s === "pending") {
    return "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-200";
  }
  if (s === "rejected") {
    return "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-200";
  }
  return "border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300";
}

function priorityClass(v?: string | null) {
  const s = String(v ?? "normal").toLowerCase();
  if (s === "critical") return "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-200";
  if (s === "high") return "border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-200";
  if (s === "low") return "border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300";
  return "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-200";
}

function priorityLabel(v?: string | null) {
  const s = String(v ?? "normal").toLowerCase();
  if (s === "critical") return "KRİTİK";
  if (s === "high") return "YÜKSEK";
  if (s === "low") return "DÜŞÜK";
  return "NORMAL";
}

function isPremiumProfile(p: any) {
  const boolPremium = p?.is_premium === true;
  const untilRaw = p?.premium_until ?? p?.membership_expires_at;
  const until = untilRaw ? new Date(untilRaw) : null;
  const status = String(p?.membership_status ?? "").toLowerCase();

  if (boolPremium && until && until.getTime() > Date.now()) return true;
  if (boolPremium && !until) return true;

  return status === "active" && !!until && until.getTime() > Date.now();
}

async function apiPatch(id: string, body: any) {
  const res = await fetch(`/api/admin/support/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j?.error ?? "request_failed");
  return j;
}

const quickResolutions = [
  "Merhaba, talebiniz incelenmeye alınmıştır. Kısa süre içinde dönüş yapılacaktır.",
  "Kontrol sağlandı. Lütfen uygulamadan çıkış yapıp tekrar giriş yaparak yeniden deneyin.",
  "KYC durumunuz kontrol ediliyor. Belgeleriniz okunaklı değilse yeniden yüklemeniz gerekebilir.",
  "Premium/vitrin aktivasyonunuz kontrol ediliyor. Ödeme onayı sonrası paketiniz aktif edilecektir.",
  "Sorun çözüldü olarak işaretlenmiştir. Devam ederse yeni destek talebi oluşturabilirsiniz.",
];

const priorities = ["low", "normal", "high", "critical"];
const categories = [
  "general",
  "kyc",
  "payment",
  "premium",
  "listing",
  "chat",
  "account",
  "technical",
];

export default function SupportDetailClient({
  initialTicket,
}: {
  initialTicket: any;
}) {
  const router = useRouter();

  const [t, setT] = useState<any>(initialTicket);
  const [busy, setBusy] = useState(false);

  const p = t?.profiles ?? {};
  const msg = (t?.message ?? t?.body ?? "").trim();

  const name =
    p?.company_name?.trim?.() ||
    p?.full_name?.trim?.() ||
    t?.contact?.trim?.() ||
    "Kullanıcı";

  const avatarUrl = (p?.avatar_url ?? "").toString().trim();
  const cityLine = [p?.city, p?.district, p?.neighborhood]
    .filter(Boolean)
    .join(" / ");

  const premium = isPremiumProfile(p);
  const currentStatus = String(t?.status ?? "open").toLowerCase();
  const isOpen = currentStatus !== "closed";

  const sla = useMemo(() => {
    const created = t?.created_at ? new Date(t.created_at).getTime() : Date.now();
    const limitHours = premium ? 6 : 24;
    const deadline = created + limitHours * 60 * 60 * 1000;
    const leftMs = deadline - Date.now();
    const overdue = leftMs < 0;
    const leftHours = Math.abs(leftMs) / 1000 / 60 / 60;

    return {
      label: premium ? "Premium SLA" : "Standart SLA",
      limit: premium ? "6 saat" : "24 saat",
      overdue,
      leftText: overdue
        ? `${leftHours.toFixed(1)} saat gecikti`
        : `${leftHours.toFixed(1)} saat kaldı`,
    };
  }, [premium, t?.created_at]);

  async function patchTicket(body: any) {
    if (busy) return;
    setBusy(true);

    try {
      const j = await apiPatch(String(t.id), body);
      setT((prev: any) => ({ ...prev, ...(j.ticket ?? {}) }));
    } catch (e: any) {
      alert(e?.message ?? "update_failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus() {
    const next = isOpen ? "closed" : "open";

    const resolution =
      next === "closed"
        ? (prompt("Kapatırken çözüm/not:", t?.resolution ?? "") ?? "").trim() ||
          null
        : t?.resolution;

    await patchTicket({ status: next, resolution });
  }

  async function editResolution() {
    const r = prompt("Resolution:", t?.resolution ?? "") ?? "";
    await patchTicket({ resolution: r.trim() || null });
  }

  async function editInternalNote() {
    const note = prompt("Admin iç notu:", t?.internal_note ?? "") ?? "";
    await patchTicket({ internal_note: note.trim() || null });
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-[0_28px_110px_rgba(0,0,0,.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.045]">
        <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-16 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-[11px] font-black text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                #{t?.ticket_no || t?.id}
              </span>

              <span className={clsx("rounded-full border px-3 py-1 text-[11px] font-black", statusClass(t?.status))}>
                {statusLabel(t?.status)}
              </span>

              <span className={clsx("rounded-full border px-3 py-1 text-[11px] font-black", priorityClass(t?.priority))}>
                {priorityLabel(t?.priority)}
              </span>

              <span className={clsx("rounded-full border px-3 py-1 text-[11px] font-black", kycClass(p?.kyc_status))}>
                {kycLabel(p?.kyc_status)}
              </span>

              {premium ? (
                <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-black text-amber-700 dark:text-amber-200">
                  ⭐ Premium
                </span>
              ) : (
                <span className="rounded-full border border-zinc-500/20 bg-zinc-500/10 px-3 py-1 text-[11px] font-black text-zinc-600 dark:text-zinc-300">
                  Standart
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
              {t?.subject || "Destek Talebi"}
            </h1>

            <p className="mt-2 text-sm font-semibold text-zinc-500 dark:text-white/55">
              Kategori: {t?.category || "general"} • Oluşturma: {fmt(t?.created_at)} • Güncelleme: {fmt(t?.updated_at)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/users/${t?.user_id}`}
              className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black text-zinc-800 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
            >
              Kullanıcıya Git →
            </Link>

            <button
              onClick={() => router.push("/admin/support")}
              className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-xs font-black transition hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              ← Liste
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-[32px] border border-black/10 bg-white/80 p-5 shadow-[0_22px_90px_rgba(0,0,0,.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045]">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-[24px] border border-black/10 bg-emerald-500/10 dark:border-white/10">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-black text-emerald-700 dark:text-emerald-200">
                    {initials(name)}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-lg font-black text-zinc-950 dark:text-white">
                  {name}
                </div>
                <div className="mt-1 text-xs font-bold text-zinc-500">
                  {p?.role || "user"} • {p?.registration_type || "—"}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <InfoRow label="Telefon" value={p?.phone || "—"} />
              <InfoRow label="E-posta" value={p?.email || "—"} />
              <InfoRow label="Şehir" value={cityLine || "—"} />
              <InfoRow label="Contact" value={t?.contact || "—"} />
              <InfoRow label="User ID" value={t?.user_id || "—"} mono />
            </div>
          </div>

          <div
            className={clsx(
              "rounded-[32px] border p-5 shadow-[0_22px_90px_rgba(0,0,0,.06)] backdrop-blur-xl",
              sla.overdue
                ? "border-rose-500/20 bg-rose-500/10"
                : "border-emerald-500/20 bg-emerald-500/10"
            )}
          >
            <div className="text-sm font-black text-zinc-950 dark:text-white">{sla.label}</div>
            <div className="mt-2 text-3xl font-black text-zinc-950 dark:text-white">{sla.leftText}</div>
            <div className="mt-2 text-xs font-bold text-zinc-500 dark:text-white/55">
              Hedef cevap süresi: {sla.limit}
            </div>
          </div>

          <AdminControlCard title="Öncelik">
            <div className="flex flex-wrap gap-2">
              {priorities.map((x) => (
                <button
                  key={x}
                  disabled={busy}
                  onClick={() => patchTicket({ priority: x })}
                  className={clsx(
                    "rounded-2xl px-4 py-2 text-xs font-black transition",
                    String(t?.priority ?? "normal") === x
                      ? "bg-emerald-500 text-black"
                      : "border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5",
                    busy && "opacity-60"
                  )}
                >
                  {x.toUpperCase()}
                </button>
              ))}
            </div>
          </AdminControlCard>

          <AdminControlCard title="Kategori">
            <div className="flex flex-wrap gap-2">
              {categories.map((x) => (
                <button
                  key={x}
                  disabled={busy}
                  onClick={() => patchTicket({ category: x })}
                  className={clsx(
                    "rounded-2xl px-4 py-2 text-xs font-black transition",
                    String(t?.category ?? "general") === x
                      ? "bg-cyan-500 text-black"
                      : "border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5",
                    busy && "opacity-60"
                  )}
                >
                  {x}
                </button>
              ))}
            </div>
          </AdminControlCard>

          <AdminControlCard title="Atama">
            <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-3 text-xs font-bold text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
              Atanan admin: {t?.assigned_admin_id || "Yok"}
            </div>

            <button
              disabled={busy}
              onClick={() => patchTicket({ assign_to_me: true })}
              className="mt-3 rounded-2xl bg-indigo-500 px-4 py-2 text-xs font-black text-white transition hover:bg-indigo-400 disabled:opacity-60"
            >
              Ticket'i Üzerime Al
            </button>
          </AdminControlCard>
        </div>

        <div className="space-y-6 lg:col-span-8">
          <Panel title="Kullanıcı Mesajı">
            <div className="rounded-3xl border border-black/10 bg-black/[0.03] p-5 text-sm leading-7 text-zinc-800 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/80">
              <div className="whitespace-pre-wrap">{msg || "—"}</div>
            </div>
          </Panel>

          <Panel title="Çözüm Notu" subtitle="Bu alan ticket kapanış notu olarak kullanılır.">
            <div className="flex flex-wrap gap-2">
              <button
                disabled={busy}
                onClick={editResolution}
                className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-xs font-black transition hover:bg-black/10 disabled:opacity-60 dark:border-white/10 dark:bg-white/5"
              >
                Notu Düzenle
              </button>

              <button
                disabled={busy}
                onClick={toggleStatus}
                className={clsx(
                  isOpen
                    ? "rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-black text-black transition hover:bg-emerald-400"
                    : "rounded-2xl bg-amber-500 px-4 py-2 text-xs font-black text-black transition hover:bg-amber-400",
                  busy && "opacity-60"
                )}
              >
                {isOpen ? "Kapat" : "Tekrar Aç"}
              </button>
            </div>

            <div className="mt-4 rounded-3xl border border-black/10 bg-white/70 p-5 text-sm leading-7 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="whitespace-pre-wrap">{t?.resolution || "—"}</div>
            </div>

            <div className="mt-5">
              <div className="mb-2 text-xs font-black text-zinc-500">Hızlı Cevap Şablonları</div>

              <div className="flex flex-wrap gap-2">
                {quickResolutions.map((x, i) => (
                  <button
                    key={x}
                    disabled={busy}
                    onClick={() => patchTicket({ resolution: x })}
                    className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[11px] font-black text-emerald-700 transition hover:bg-emerald-500/15 disabled:opacity-60 dark:text-emerald-200"
                  >
                    Şablon {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Admin İç Notu" subtitle="Kullanıcı görmez. Sadece admin tarafında tutulur.">
            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm leading-7 text-zinc-800 dark:text-white/80">
              <div className="whitespace-pre-wrap">{t?.internal_note || "Henüz iç not yok."}</div>
            </div>

            <button
              disabled={busy}
              onClick={editInternalNote}
              className="mt-4 rounded-2xl bg-amber-500 px-4 py-2 text-xs font-black text-black transition hover:bg-amber-400 disabled:opacity-60"
            >
              İç Not Düzenle
            </button>
          </Panel>

          <Panel title="Ticket Zaman Çizelgesi">
            <div className="space-y-3">
              <TimelineItem title="Ticket oluşturuldu" time={fmt(t?.created_at)} />
              <TimelineItem title="Son güncelleme" time={fmt(t?.updated_at)} />
              {t?.assigned_admin_id ? (
                <TimelineItem title="Admin ataması yapıldı" time={t?.assigned_admin_id} />
              ) : null}
              {t?.closed_at ? (
                <TimelineItem title="Ticket kapatıldı" time={fmt(t?.closed_at)} />
              ) : null}
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function AdminControlCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[32px] border border-black/10 bg-white/80 p-5 shadow-[0_22px_90px_rgba(0,0,0,.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045]">
      <div className="mb-3 text-sm font-black text-zinc-950 dark:text-white">{title}</div>
      {children}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[32px] border border-black/10 bg-white/80 p-5 shadow-[0_22px_90px_rgba(0,0,0,.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045]">
      <div className="mb-3">
        <div className="text-sm font-black text-zinc-500">{title}</div>
        {subtitle ? (
          <div className="mt-1 text-xs font-semibold text-zinc-500">{subtitle}</div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-3 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-[11px] font-black uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div
        className={clsx(
          "mt-1 truncate text-sm font-bold text-zinc-900 dark:text-white",
          mono && "font-mono text-[11px]"
        )}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function TimelineItem({ title, time }: { title: string; time: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_14px_rgba(34,197,94,.8)]" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-black text-zinc-900 dark:text-white">
          {title}
        </div>
        <div className="text-xs font-semibold text-zinc-500">{time}</div>
      </div>
    </div>
  );
}