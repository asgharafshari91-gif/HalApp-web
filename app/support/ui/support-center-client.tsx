"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Ticket = {
  id: string;
  ticket_no?: string | null;
  subject: string;
  category?: string | null;
  priority?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function fmt(dt?: string | null) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

function statusClass(status?: string | null) {
  const s = String(status ?? "open").toLowerCase();
  if (s === "closed") return "bg-emerald-500/10 text-emerald-700";
  return "bg-orange-500/10 text-orange-700";
}

export default function SupportCenterClient() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [authed, setAuthed] = useState(false);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function loadTickets() {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;

    if (!uid) {
      setAuthed(false);
      setTickets([]);
      setLoading(false);
      return;
    }

    setAuthed(true);

    const { data, error } = await supabase
      .from("support_tickets")
      .select("id,ticket_no,subject,category,priority,status,created_at,updated_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (!error) setTickets((data ?? []) as Ticket[]);

    setLoading(false);
  }

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;

    if (!uid) {
      window.location.href = `/auth?next=${encodeURIComponent("/support")}`;
      return;
    }

    if (!subject.trim() || !message.trim()) {
      alert("Konu ve açıklama gerekli.");
      return;
    }

    setSending(true);

    try {
      const ticketNo = `HAL-${new Date().getFullYear()}-${Math.floor(
        100000 + Math.random() * 900000
      )}`;

      const { error } = await supabase.from("support_tickets").insert({
  user_id: uid,
  subject: subject.trim(),
  category,
  message: message.trim(),
  status: "open",
  priority: "normal",
});

      if (error) throw error;

      setSubject("");
      setCategory("general");
      setMessage("");

      await loadTickets();
    } catch (e: any) {
      alert(e?.message ?? "Ticket oluşturulamadı.");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <section className="relative overflow-hidden rounded-[40px] border border-black/10 bg-white/80 p-6 shadow-[0_30px_120px_rgba(0,0,0,.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.045] sm:p-10">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="relative">
          <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-700 dark:text-emerald-200">
            HALAPP DESTEK MERKEZİ
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-6xl">
            Ticket oluştur, cevabı canlı takip et.
          </h1>

          <p className="mt-4 max-w-3xl text-sm font-semibold leading-relaxed text-zinc-600 dark:text-white/60 sm:text-lg">
            KYC, premium, ilan, mesajlaşma, QR giriş ve teknik sorunlar için destek
            talebi oluşturabilir, admin cevaplarını buradan takip edebilirsin.
          </p>
        </div>
      </section>

      {!authed && !loading ? (
        <section className="mt-8 rounded-[34px] border border-orange-500/20 bg-orange-500/10 p-6">
          <div className="text-xl font-black text-zinc-950 dark:text-white">
            Destek taleplerini görmek için giriş yapmalısın.
          </div>

          <Link
            href={`/auth?next=${encodeURIComponent("/support")}`}
            className="mt-5 inline-flex rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-black"
          >
            Giriş Yap
          </Link>
        </section>
      ) : (
        <section className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <form
              onSubmit={createTicket}
              className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-[0_24px_90px_rgba(0,0,0,.06)] dark:border-white/10 dark:bg-white/[0.045]"
            >
              <h2 className="text-2xl font-black text-zinc-950 dark:text-white">
                Yeni Destek Talebi
              </h2>

              <div className="mt-5">
                <label className="mb-2 block text-xs font-black text-zinc-500">
                  Konu
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Örn: Premium paketim aktif olmadı"
                  className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold outline-none dark:border-white/10 dark:bg-black/20"
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-black text-zinc-500">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm font-black outline-none dark:border-white/10 dark:bg-black/20"
                >
                  <option value="general">Genel</option>
                  <option value="kyc">KYC</option>
                  <option value="premium">Premium</option>
                  <option value="payment">Ödeme</option>
                  <option value="listing">İlan</option>
                  <option value="chat">Mesajlaşma</option>
                  <option value="account">Hesap</option>
                  <option value="technical">Teknik</option>
                </select>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-black text-zinc-500">
                  Açıklama
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={7}
                  placeholder="Sorunu detaylı yaz..."
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold outline-none dark:border-white/10 dark:bg-black/20"
                />
              </div>

              <button
                disabled={sending}
                className="mt-5 h-14 w-full rounded-2xl bg-emerald-500 text-sm font-black text-black shadow-[0_20px_60px_rgba(34,197,94,.22)] hover:bg-emerald-400 disabled:opacity-60"
              >
                {sending ? "Gönderiliyor..." : "Destek Talebi Oluştur"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-[0_24px_90px_rgba(0,0,0,.06)] dark:border-white/10 dark:bg-white/[0.045]">
              <h2 className="text-2xl font-black text-zinc-950 dark:text-white">
                Taleplerim
              </h2>

              <div className="mt-5 space-y-3">
                {loading ? (
                  <div className="rounded-2xl border border-black/10 p-6 text-center text-sm font-black text-zinc-500 dark:border-white/10">
                    Yükleniyor...
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-black/10 p-8 text-center dark:border-white/10">
                    <div className="text-4xl">🎫</div>
                    <div className="mt-3 font-black">Henüz ticket yok</div>
                    <div className="mt-1 text-sm text-zinc-500">
                      İlk destek talebini soldaki formdan oluştur.
                    </div>
                  </div>
                ) : (
                  tickets.map((t) => (
                    <Link
                      key={t.id}
                      href={`/support/${t.id}`}
                      className="block rounded-[26px] border border-black/10 bg-white/70 p-5 transition hover:bg-emerald-500/5 dark:border-white/10 dark:bg-white/[0.04]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                            #{t.ticket_no || t.id}
                          </div>
                          <div className="mt-1 text-lg font-black text-zinc-950 dark:text-white">
                            {t.subject}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-zinc-500">
                            {t.category || "general"} • {fmt(t.created_at)}
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(
                            t.status
                          )}`}
                        >
                          {String(t.status ?? "open").toLowerCase() === "closed"
                            ? "Kapalı"
                            : "Açık"}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}