"use client";

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useRef, useState } from "react";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function fmt(dt?: string | null) {
  if (!dt) return "";

  try {
    return new Date(dt).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function dayFmt(dt?: string | null) {
  if (!dt) return "";

  try {
    return new Date(dt).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function sameDay(a?: string | null, b?: string | null) {
  if (!a || !b) return false;

  try {
    const da = new Date(a);
    const db = new Date(b);

    return (
      da.getFullYear() === db.getFullYear() &&
      da.getMonth() === db.getMonth() &&
      da.getDate() === db.getDate()
    );
  } catch {
    return false;
  }
}

export default function SupportChat({
  ticketId,
}: {
  ticketId: string;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  async function loadMessages() {
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/support/${ticketId}/messages`, {
        cache: "no-store",
      });

      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(j?.error ?? "messages_load_failed");
      }

      setMessages(j.items ?? []);
    } catch (e: any) {
      alert(e?.message ?? "messages_load_failed");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    const value = text.trim();

    if (!value || sending) return;

    setSending(true);

    try {
      const res = await fetch(`/api/admin/support/${ticketId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: value,
        }),
      });

      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(j?.error ?? "send_failed");
      }

      setText("");

      if (j?.message) {
        setMessages((prev) => {
          if (prev.some((x) => x.id === j.message.id)) return prev;
          return [...prev, j.message];
        });
      }

      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    } catch (e: any) {
      alert(e?.message ?? "send_failed");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`admin-support-chat-${ticketId}`)
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
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "support_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          const row = payload.new as any;

          setMessages((prev) =>
            prev.map((x) => (x.id === row.id ? { ...x, ...row } : x))
          );
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
      block: "end",
    });
  }, [messages]);

  return (
    <div className="relative overflow-hidden rounded-[34px] border border-black/10 bg-white/80 shadow-[0_24px_100px_rgba(0,0,0,.07)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.045]">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative border-b border-black/10 px-5 py-4 dark:border-white/10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-black text-zinc-950 dark:text-white">
              Ticket Sohbeti
            </div>

            <div className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/45">
              Kullanıcı ile canlı destek konuşması
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Realtime aktif
          </div>
        </div>
      </div>

      <div className="relative max-h-[560px] min-h-[420px] space-y-3 overflow-y-auto px-4 py-5 sm:px-5">
        {loading ? (
          <div className="flex h-[320px] items-center justify-center">
            <div className="rounded-2xl border border-black/10 bg-white/70 px-5 py-3 text-sm font-black text-zinc-500 dark:border-white/10 dark:bg-white/[0.04]">
              Mesajlar yükleniyor...
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-[320px] items-center justify-center">
            <div className="text-center">
              <div className="text-5xl">💬</div>
              <div className="mt-3 text-lg font-black text-zinc-950 dark:text-white">
                Henüz mesaj yok
              </div>
              <div className="mt-1 text-sm font-semibold text-zinc-500">
                Kullanıcıya ilk cevabı buradan yaz.
              </div>
            </div>
          </div>
        ) : (
          messages.map((m, i) => {
            const isAdmin = m.sender_role === "admin";
            const prev = messages[i - 1];
            const showDay = !prev || !sameDay(prev.created_at, m.created_at);

            return (
              <div key={m.id}>
                {showDay ? (
                  <div className="my-4 flex justify-center">
                    <span className="rounded-full border border-black/10 bg-white/75 px-3 py-1 text-[11px] font-black text-zinc-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/50">
                      {dayFmt(m.created_at)}
                    </span>
                  </div>
                ) : null}

                <div
                  className={clsx(
                    "flex",
                    isAdmin ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={clsx(
                      "max-w-[86%] rounded-[24px] px-4 py-3 shadow-sm sm:max-w-[78%]",
                      isAdmin
                        ? "rounded-br-md bg-emerald-500 text-black shadow-emerald-500/20"
                        : "rounded-bl-md border border-black/10 bg-white text-zinc-900 dark:border-white/10 dark:bg-white/[0.08] dark:text-white"
                    )}
                  >
                    <div
                      className={clsx(
                        "mb-1 text-[11px] font-black",
                        isAdmin ? "text-black/65" : "text-zinc-500"
                      )}
                    >
                      {isAdmin ? "Admin" : "Kullanıcı"}
                    </div>

                    <div className="whitespace-pre-wrap break-words text-sm leading-6">
                      {m.message}
                    </div>

                    <div
                      className={clsx(
                        "mt-2 flex items-center justify-end gap-1 text-[10px] font-bold",
                        isAdmin ? "text-black/60" : "text-zinc-400"
                      )}
                    >
                      <span>{fmt(m.created_at)}</span>

                      {isAdmin ? (
                        <span title={m.read_at ? "Kullanıcı okudu" : "Kullanıcı henüz okumadı"}>
                          {m.read_at ? "✓✓" : "✓"}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div ref={bottomRef} />
      </div>

      <div className="relative border-t border-black/10 bg-white/70 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
        <div className="flex flex-col gap-3 sm:flex-row">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Kullanıcıya cevap yaz..."
            className="min-h-[76px] flex-1 resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-emerald-500/40 focus:shadow-[0_0_0_4px_rgba(34,197,94,.12)] dark:border-white/10 dark:bg-black/20 dark:text-white"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />

          <button
            type="button"
            onClick={sendMessage}
            disabled={sending || !text.trim()}
            className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-black shadow-[0_18px_50px_rgba(34,197,94,.22)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-36"
          >
            {sending ? "..." : "Gönder"}
          </button>
        </div>

        <div className="mt-2 text-[11px] font-semibold text-zinc-400">
          Ctrl + Enter ile hızlı gönder.
        </div>
      </div>
    </div>
  );
}