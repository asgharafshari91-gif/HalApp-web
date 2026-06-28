"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Notice = {
  id: string;
  type: "kyc" | "support" | "payment";
  title: string;
  desc: string;
  href: string;
  created_at: string;
};

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

function tone(type: Notice["type"]) {
  if (type === "kyc") return "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200";
  if (type === "payment") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
  return "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-200";
}

export default function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notice[]>([]);

  async function load() {
    const next: Notice[] = [];

    const [kycRes, supportRes] = await Promise.all([
      supabase
        .from("kyc_requests")
        .select("id,user_id,status,created_at,submitted_at")
        .eq("status", "pending")
        .order("submitted_at", { ascending: false })
        .limit(5),

      supabase
        .from("support_tickets")
        .select("id,user_id,status,subject,created_at")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    for (const k of kycRes.data ?? []) {
      next.push({
        id: `kyc-${k.id}`,
        type: "kyc",
        title: "Yeni KYC bekliyor",
        desc: k.user_id ? `user: ${k.user_id}` : "Kullanıcı bilgisi yok",
        href: `/admin/kyc/${k.id}`,
        created_at: k.submitted_at || k.created_at,
      });
    }

    for (const s of supportRes.data ?? []) {
      next.push({
        id: `support-${s.id}`,
        type: "support",
        title: s.subject || "Açık destek talebi",
        desc: s.user_id ? `user: ${s.user_id}` : "Kullanıcı bilgisi yok",
        href: `/admin/support/${s.id}`,
        created_at: s.created_at,
      });
    }

    next.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setItems(next.slice(0, 10));
  }

  useEffect(() => {
    load();

    const channel = supabase
      .channel("admin-notification-bell")
      .on("postgres_changes", { event: "*", schema: "public", table: "kyc_requests" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const count = useMemo(() => items.length, [items]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="relative h-11 rounded-2xl border border-black/10 bg-white/80 px-4 text-sm font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04]"
      >
        🔔
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white">
            {count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[340px] overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950">
          <div className="border-b border-black/10 p-4 dark:border-white/10">
            <div className="text-sm font-black">Bildirim Merkezi</div>
            <div className="mt-1 text-xs font-semibold text-black/50 dark:text-white/50">
              KYC ve destek kuyruğu
            </div>
          </div>

          <div className="max-h-[420px] overflow-auto">
            {items.length === 0 ? (
              <div className="p-6 text-sm font-semibold text-black/50 dark:text-white/50">
                Yeni bildirim yok.
              </div>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-black/5 p-4 hover:bg-black/[0.03] dark:border-white/5 dark:hover:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black">{n.title}</div>
                      <div className="mt-1 truncate text-xs font-semibold text-black/50 dark:text-white/50">
                        {n.desc}
                      </div>
                      <div className="mt-2 text-[11px] font-bold text-black/40 dark:text-white/40">
                        {fmt(n.created_at)}
                      </div>
                    </div>

                    <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black ${tone(n.type)}`}>
                      {n.type.toUpperCase()}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-black/10 p-3 dark:border-white/10">
            <Link
              href="/admin/kyc?status=pending"
              onClick={() => setOpen(false)}
              className="rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-center text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04]"
            >
              KYC →
            </Link>

            <Link
              href="/admin/support?status=open"
              onClick={() => setOpen(false)}
              className="rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-center text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04]"
            >
              Support →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}