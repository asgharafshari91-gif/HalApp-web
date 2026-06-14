"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function fmt(dt?: string | null) {
  if (!dt) return "";
  try {
    return new Date(dt).toLocaleString("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

export default function SupportChatClient({ ticket }: { ticket: any }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const ticketId = String(ticket.id);
  const closed = String(ticket.status ?? "open").toLowerCase() === "closed";

  async function loadMessages() {
    const res = await fetch(`/api/support/${ticketId}/messages`, {
      cache: "no-store",
    });

    const j = await res.json().catch(() => ({}));

    if (res.ok) {
      setMessages(j.items ?? []);
    }
  }

  async function sendMessage() {
    if (!text.trim() || closed) return;

    setSending(true);

    try {
      const res = await fetch(`/api/support/${ticketId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text.trim(),
        }),
      });

     const j = await res.json().catch(() => ({}));

if (!res.ok) throw new Error(j?.error ?? "send_failed");

if (j?.message) {
  setMessages((prev) => {
    if (prev.some((x) => x.id === j.message.id)) return prev;
    return [...prev, j.message];
  });
}

setText("");
    } catch (e: any) {
      alert(e?.message ?? "Mesaj gönderilemedi.");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`user-support-chat-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          const row = payload.new as any;

          setMessages((prev) => {
            if (prev.some((x) => x.id === row.id)) return prev;
            return [...prev, row];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <section className="relative overflow-hidden rounded-[38px] border border-black/10 bg-white/80 p-6 shadow-[0_30px_120px_rgba(0,0,0,.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.045] sm:p-8">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/support"
              className="inline-flex rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs font-black text-zinc-700 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            >
              ← Destek Merkezine Dön
            </Link>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-200">
                #{ticket.ticket_no || ticket.id}
              </span>

              <span
                className={
                  closed
                    ? "rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-200"
                    : "rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-black text-orange-700 dark:text-orange-200"
                }
              >
                {closed ? "Kapalı" : "Açık"}
              </span>

              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-700 dark:text-blue-200">
                {ticket.category || "general"}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
              {ticket.subject || "Destek Talebi"}
            </h1>

            <p className="mt-2 text-sm font-semibold text-zinc-500 dark:text-white/55">
              Oluşturma: {fmt(ticket.created_at)} • Güncelleme:{" "}
              {fmt(ticket.updated_at)}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[34px] border border-black/10 bg-white/80 p-5 shadow-[0_24px_90px_rgba(0,0,0,.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-black text-zinc-950 dark:text-white">
              Destek Sohbeti
            </div>
            <div className="mt-1 text-xs font-semibold text-zinc-500">
              HalApp destek ekibi ile konuşma geçmişin.
            </div>
          </div>

          {closed ? (
            <span className="rounded-full bg-zinc-500/10 px-3 py-1 text-xs font-black text-zinc-600 dark:text-zinc-300">
              Sohbet kapalı
            </span>
          ) : (
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-200">
              Canlı takip aktif
            </span>
          )}
        </div>

        <div className="max-h-[560px] min-h-[360px] space-y-3 overflow-y-auto rounded-[28px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-black/20">
          {messages.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-center">
              <div>
                <div className="text-5xl">💬</div>
                <div className="mt-3 text-lg font-black text-zinc-950 dark:text-white">
                  Henüz mesaj yok
                </div>
                <div className="mt-1 text-sm font-semibold text-zinc-500">
                  İlk mesajın destek talebindeki açıklamadır. Buradan devam
                  edebilirsin.
                </div>
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isAdmin = m.sender_role === "admin";

              return (
                <div
                  key={m.id}
                  className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[82%] rounded-3xl px-4 py-3 shadow-sm ${
                      isAdmin
                        ? "bg-white text-zinc-900 dark:bg-white/10 dark:text-white"
                        : "bg-emerald-500 text-black"
                    }`}
                  >
                    <div className="mb-1 text-[11px] font-black opacity-70">
                      {isAdmin ? "HalApp Destek" : "Sen"}
                    </div>

                    <div className="whitespace-pre-wrap text-sm leading-6">
                      {m.message}
                    </div>

                    <div className="mt-2 text-[10px] font-bold opacity-65">
                      {fmt(m.created_at)}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div ref={bottomRef} />
        </div>

        <div className="mt-4">
          {closed ? (
            <div className="rounded-2xl border border-zinc-500/20 bg-zinc-500/10 p-4 text-sm font-bold text-zinc-600 dark:text-zinc-300">
              Bu ticket kapatılmış. Yeni sorun için yeni destek talebi
              oluşturabilirsin.
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="Mesaj yaz..."
                className="flex-1 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-500/40 dark:border-white/10 dark:bg-black/20"
              />

              <button
                onClick={sendMessage}
                disabled={sending || !text.trim()}
                className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-black shadow-[0_20px_60px_rgba(34,197,94,.22)] transition hover:bg-emerald-400 disabled:opacity-60 sm:w-36"
              >
                {sending ? "..." : "Gönder"}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}