"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Activity = {
  id: string;
  type: "user" | "kyc" | "support" | "audit";
  title: string;
  desc: string;
  href: string;
  created_at: string;
};

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
    return String(dt);
  }
}

function icon(type: Activity["type"]) {
  if (type === "user") return "👤";
  if (type === "kyc") return "🪪";
  if (type === "support") return "🎫";
  return "🔒";
}

function tone(type: Activity["type"]) {
  if (type === "user") return "border-sky-500/20 bg-sky-500/10";
  if (type === "kyc") return "border-amber-500/20 bg-amber-500/10";
  if (type === "support") return "border-emerald-500/20 bg-emerald-500/10";
  return "border-indigo-500/20 bg-indigo-500/10";
}

export default function AdminLiveActivity() {
  const [items, setItems] = useState<Activity[]>([]);
  const [live, setLive] = useState(false);

  async function load() {
    const next: Activity[] = [];

    const [usersRes, kycRes, supportRes, auditRes] = await Promise.allSettled([
      supabase
        .from("profiles")
        .select("id,full_name,company_name,email,phone,created_at")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("kyc_requests")
        .select("id,user_id,status,created_at,submitted_at")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("support_tickets")
        .select("id,user_id,subject,status,created_at")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("admin_audit_log")
        .select("id,actor_id,action,summary,created_at,target_user_id")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (usersRes.status === "fulfilled" && !usersRes.value.error) {
      for (const u of usersRes.value.data ?? []) {
        next.push({
          id: `user-${u.id}`,
          type: "user",
          title: "Yeni kullanıcı",
          desc: u.company_name || u.full_name || u.email || u.phone || u.id,
          href: `/admin/users/${u.id}`,
          created_at: u.created_at,
        });
      }
    }

    if (kycRes.status === "fulfilled" && !kycRes.value.error) {
      for (const k of kycRes.value.data ?? []) {
        next.push({
          id: `kyc-${k.id}`,
          type: "kyc",
          title: `KYC ${String(k.status ?? "pending").toUpperCase()}`,
          desc: k.user_id ? `user: ${k.user_id}` : "Kullanıcı bilgisi yok",
          href: `/admin/kyc/${k.id}`,
          created_at: k.submitted_at || k.created_at,
        });
      }
    }

    if (supportRes.status === "fulfilled" && !supportRes.value.error) {
      for (const s of supportRes.value.data ?? []) {
        next.push({
          id: `support-${s.id}`,
          type: "support",
          title: s.subject || "Destek talebi",
          desc: `status: ${s.status ?? "open"} • user: ${s.user_id ?? "—"}`,
          href: `/admin/support/${s.id}`,
          created_at: s.created_at,
        });
      }
    }

    if (auditRes.status === "fulfilled" && !auditRes.value.error) {
      for (const a of auditRes.value.data ?? []) {
        next.push({
          id: `audit-${a.id}`,
          type: "audit",
          title: a.action || "Admin işlemi",
          desc: a.summary || `actor: ${a.actor_id ?? "—"}`,
          href: "/admin/audit",
          created_at: a.created_at,
        });
      }
    }

    next.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setItems(next.slice(0, 12));
  }

  useEffect(() => {
    load();

    const channel = supabase
      .channel("admin-live-activity")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "kyc_requests" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_audit_log" }, load)
      .subscribe((s) => setLive(s === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const count = useMemo(() => items.length, [items]);

  return (
    <section className="rounded-[30px] border border-black/10 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-black">⚡ Canlı Aktivite</div>
          <div className="mt-1 text-sm font-semibold text-black/55 dark:text-white/55">
            Kullanıcı, KYC, destek ve admin hareketleri.
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-black text-black/50 dark:text-white/50">
          <span className={clsx("h-2 w-2 rounded-full", live ? "animate-pulse bg-emerald-500" : "bg-zinc-400")} />
          {live ? "Live" : "Connecting"}
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {count === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 bg-white/50 px-4 py-8 text-center text-sm font-semibold text-black/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50">
            Henüz aktivite yok.
          </div>
        ) : (
          items.map((a) => (
            <Link
              key={a.id}
              href={a.href}
              className={clsx(
                "rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md",
                tone(a.type)
              )}
            >
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/70 text-lg dark:bg-white/[0.05]">
                  {icon(a.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-black">{a.title}</div>
                  <div className="mt-1 truncate text-xs font-semibold text-black/55 dark:text-white/55">
                    {a.desc}
                  </div>
                  <div className="mt-2 text-[11px] font-bold text-black/40 dark:text-white/40">
                    {fmt(a.created_at)}
                  </div>
                </div>

                <div className="text-xs font-black text-black/35 dark:text-white/35">→</div>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}