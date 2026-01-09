"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_70px_rgba(0,0,0,0.45)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-black">{title}</div>
          {desc ? (
            <div className="mt-1 text-sm text-black/60 dark:text-white/60 leading-6">
              {desc}
            </div>
          ) : null}
        </div>

        <Link
          href="/settings"
          className="rounded-2xl border border-black/10 bg-black/5 px-3 py-2 text-xs font-extrabold text-black/75 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10"
        >
          ← Ayarlar
        </Link>
      </div>

      <div className="mt-5">{children}</div>
    </div>
  );
}

function Badge({
  children,
  variant = "sky",
}: {
  children: React.ReactNode;
  variant?: "emerald" | "amber" | "sky" | "rose";
}) {
  const cls =
    variant === "amber"
      ? "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200"
      : variant === "rose"
      ? "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-200"
      : variant === "emerald"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
      : "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-200";

  return (
    <span className={clsx("inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-extrabold", cls)}>
      {children}
    </span>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      type={type}
      className={clsx(
        "w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-extrabold text-black/80 outline-none",
        "focus:ring-2 focus:ring-emerald-500/40",
        "dark:border-white/10 dark:bg-black/30 dark:text-white/85",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    />
  );
}

type TicketRow = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  contact: string | null;
  status: "open" | "answered" | "closed" | string;
  created_at: string;
};

function statusVariant(s: string) {
  const v = (s || "").toLowerCase();
  if (v === "answered") return "emerald";
  if (v === "closed") return "rose";
  return "sky"; // open
}

function prettyStatus(s: string) {
  const v = (s || "").toLowerCase();
  if (v === "answered") return "Cevaplandı";
  if (v === "closed") return "Kapandı";
  return "Açık";
}

export default function ReportPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const { toast } = useToast();

  // ✅ /settings/report?user=<uuid>
  const reportedUserId = useMemo(() => (sp.get("user") || "").trim() || null, [sp]);

  const [uid, setUid] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [subject, setSubject] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");

  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [listLoading, setListLoading] = useState(true);

  async function ensureAuth() {
    const { data } = await supabase.auth.getSession();
    const id = data.session?.user?.id ?? null;
    if (!id) {
      router.replace(`/auth?next=${encodeURIComponent("/settings/report" + (reportedUserId ? `?user=${reportedUserId}` : ""))}`);
      return null;
    }
    setUid(id);
    return id;
  }

  async function loadTickets(myId: string) {
    setListLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("id,user_id,subject,message,contact,status,created_at")
        .eq("user_id", myId)
        .order("created_at", { ascending: false })
        .limit(25);

      if (error) throw error;
      setTickets((data ?? []) as any);
    } catch (e: any) {
      toast({ variant: "error", title: "Biletler yüklenemedi", message: e?.message ?? "Hata oluştu." });
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      const myId = await ensureAuth();
      if (!myId) return;
      await loadTickets(myId);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportedUserId]);

  function canSend() {
    if (!subject.trim()) return false;
    if (!message.trim()) return false;
    return true;
  }

  async function submitTicket() {
    if (!uid) return;

    if (!canSend()) {
      toast({
        variant: "warning",
        title: "Eksik bilgi",
        message: "Konu ve mesaj zorunlu.",
      });
      return;
    }

    setSending(true);
    try {
      // ✅ Şikayet edilen kullanıcıyı tabloya kolon eklemeden mesaja gömüyoruz
      const header = reportedUserId ? `ReportedUserId: ${reportedUserId}\n---\n` : "";
      const finalMessage = header + message.trim();

      const payload = {
        user_id: uid,
        subject: subject.trim(),
        message: finalMessage,
        contact: contact.trim() || null,
        status: "open",
        // created_at default now() zaten var
      };

      const { error } = await supabase.from("support_tickets").insert(payload);
      if (error) throw error;

      toast({ variant: "success", title: "Gönderildi", message: "Bildirimin alındı.", durationMs: 1400 });

      setSubject("");
      setContact("");
      setMessage("");

      await loadTickets(uid);
    } catch (e: any) {
      toast({ variant: "error", title: "Gönderilemedi", message: e?.message ?? "Hata oluştu." });
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
          Yükleniyor…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card
        title={reportedUserId ? "Sorun Bildir / Şikayet" : "Destek Talebi / Sorun Bildir"}
        desc={
          reportedUserId
            ? "Bu kullanıcıyla ilgili bir sorun bildiriyorsun. Detay yaz, ekip inceleyip dönüş yapacak."
            : "Bir sorun mu var? Detay yaz, ekip inceleyip dönüş yapacak."
        }
      >
        {reportedUserId ? (
          <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-black/75 dark:text-white/75">
            <div className="font-extrabold">Şikayet edilen kullanıcı</div>
            <div className="mt-1 text-xs opacity-80 break-all">{reportedUserId}</div>
          </div>
        ) : null}

        <div className="grid gap-3">
          <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-extrabold text-black/55 dark:text-white/55">Konu (Zorunlu)</div>
            <div className="mt-2">
              <Input
                value={subject}
                onChange={setSubject}
                placeholder="Örn: Spam / Dolandırıcılık / Uygunsuz içerik / Uygulama hatası"
                disabled={sending}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-extrabold text-black/55 dark:text-white/55">İletişim (Opsiyonel)</div>
            <div className="mt-2">
              <Input
                value={contact}
                onChange={setContact}
                placeholder="Telefon veya e-posta (istersen)"
                disabled={sending}
              />
            </div>
            <div className="mt-2 text-[11px] text-black/50 dark:text-white/50">
              Not: Profilindeki telefon/e-posta yoksa buraya yazabilirsin.
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-extrabold text-black/55 dark:text-white/55">Mesaj (Zorunlu)</div>
            <div className="mt-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={sending}
                placeholder="Detaylı anlat: ne oldu, hangi sayfada, tarih/saat, varsa ekran görüntüsü linki vb."
                className={clsx(
                  "w-full min-h-[140px] rounded-2xl border border-black/10 bg-white/80 px-4 py-3",
                  "text-sm font-extrabold text-black/80 outline-none",
                  "focus:ring-2 focus:ring-emerald-500/40",
                  "dark:border-white/10 dark:bg-black/30 dark:text-white/85",
                  sending && "opacity-60 cursor-not-allowed"
                )}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={submitTicket}
            disabled={sending || !canSend()}
            className={clsx(
              "rounded-2xl px-4 py-3 text-sm font-black transition",
              "bg-emerald-500 text-black hover:bg-emerald-400",
              (sending || !canSend()) && "opacity-60 cursor-not-allowed"
            )}
          >
            {sending ? "Gönderiliyor…" : "Gönder"}
          </button>

          <div className="rounded-2xl border border-black/10 bg-black/5 p-4 text-xs text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60 leading-6">
            <b>Bilgi:</b> Bu form <code>support_tickets</code> tablosuna kayıt atar. Durumu <b>Açık / Cevaplandı / Kapandı</b>{" "}
            olarak takip edebilirsin.
          </div>
        </div>
      </Card>

      <Card title="Son Taleplerim" desc="En son gönderdiğin destek/şikayet kayıtları">
        {listLoading ? (
          <div className="rounded-2xl border border-black/10 bg-black/5 p-4 text-sm font-semibold text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            Yükleniyor…
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm font-semibold text-black/70 dark:text-white/70">
            Henüz kayıt yok.
          </div>
        ) : (
          <div className="grid gap-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="rounded-3xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-black text-black/90 dark:text-white/90">{t.subject}</div>
                  <Badge variant={statusVariant(t.status)}>{prettyStatus(t.status)}</Badge>
                </div>

                <div className="mt-2 text-xs text-black/55 dark:text-white/55">
                  {new Date(t.created_at).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}
                  {t.contact ? <span className="ml-2">• İletişim: {t.contact}</span> : null}
                </div>

                <div className="mt-3 text-sm font-semibold text-black/70 dark:text-white/70 whitespace-pre-wrap break-words">
                  {t.message}
                </div>

                <div className="mt-3 text-[11px] text-black/45 dark:text-white/45 break-all">
                  Ticket ID: {t.id}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}