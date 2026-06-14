"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  last_message_preview?: string | null;
  unread_user_count?: number | null;
};

type SmartTopic = {
  id: string;
  icon: string;
  title: string;
  category: string;
  subject: string;
  messageTemplate: string;
  summary: string;
  steps: string[];
  cta: string;
};

const smartTopics: SmartTopic[] = [
  {
    id: "premium",
    icon: "⭐",
    title: "Premium paketim aktif olmadı",
    category: "premium",
    subject: "Premium paketim aktif olmadı",
    messageTemplate:
      "Merhaba, premium/vitrin paketim aktif olmadı. Ödeme yaptıysam dekont ve paket bilgisini kontrol eder misiniz?",
    summary:
      "Ödeme onayı, paket süresi veya vitrin aktivasyonu beklemede olabilir.",
    steps: [
      "Profil > Paketlerim alanından paket durumunu kontrol et.",
      "Ödeme yaptıysan ödeme geçmişinde onay durumuna bak.",
      "Dekont yüklediysen admin onayı birkaç dakika sürebilir.",
      "Paket aktif değilse ticket oluştur, destek ekibi kontrol etsin.",
    ],
    cta: "Premium ticket hazırla",
  },
  {
    id: "kyc",
    icon: "🛡️",
    title: "KYC / hesap onayım bekliyor",
    category: "kyc",
    subject: "KYC onayım bekliyor",
    messageTemplate:
      "Merhaba, KYC/hayat kimlik doğrulama başvurum bekliyor. Belgelerimi ve profilimi kontrol eder misiniz?",
    summary:
      "Kimlik, selfie veya firma bilgileri okunaklı değilse inceleme uzayabilir.",
    steps: [
      "Profil sayfasında KYC durumunu kontrol et.",
      "Kimlik ön/arka ve selfie görsellerinin net olduğundan emin ol.",
      "Firma hesabıysa vergi/hal kayıt bilgilerini doldur.",
      "Red aldıysan açıklamadaki eksikleri tamamlayıp tekrar gönder.",
    ],
    cta: "KYC ticket hazırla",
  },
  {
    id: "listing",
    icon: "📦",
    title: "İlanım görünmüyor / yayınlanmadı",
    category: "listing",
    subject: "İlanım görünmüyor",
    messageTemplate:
      "Merhaba, oluşturduğum ilan görünmüyor veya yayına alınmadı. İlanımı kontrol eder misiniz?",
    summary:
      "İlan süresi, görsel yükleme, kategori veya hesap onayı nedeniyle görünmeyebilir.",
    steps: [
      "Profil > İlanlarım alanında ilanın durumunu kontrol et.",
      "Fotoğraf/video yüklemesi tamamlandı mı bak.",
      "İlan süresi dolduysa uzatma paketi gerekebilir.",
      "KYC gerekli alanlarda onay yoksa ilan kısıtlanabilir.",
    ],
    cta: "İlan ticket hazırla",
  },
  {
    id: "messages",
    icon: "💬",
    title: "Mesajlar açılmıyor",
    category: "chat",
    subject: "Mesajlar açılmıyor",
    messageTemplate:
      "Merhaba, mesajlarım açılmıyor veya konuşmaya giremiyorum. Hesabımı ve mesaj izinlerini kontrol eder misiniz?",
    summary:
      "Mesajlaşma için giriş, profil tamamlanması ve bazı durumlarda KYC gerekebilir.",
    steps: [
      "Oturumunun açık olduğundan emin ol.",
      "Profil bilgilerinin tamamlandığını kontrol et.",
      "KYC gerekiyorsa profil sayfasından onay sürecini tamamla.",
      "Hâlâ açılmıyorsa ticket oluştur.",
    ],
    cta: "Mesaj ticket hazırla",
  },
  {
    id: "qr",
    icon: "🔐",
    title: "QR ile web girişi çalışmıyor",
    category: "technical",
    subject: "QR ile web girişi çalışmıyor",
    messageTemplate:
      "Merhaba, QR ile web girişinde sorun yaşıyorum. QR okutuyorum fakat web oturumu açılmıyor.",
    summary:
      "QR süresi dolmuş, mobil uygulama oturumu kapalı veya bağlantı gecikmiş olabilir.",
    steps: [
      "Web QR sayfasını yenileyip yeni QR oluştur.",
      "Mobil uygulamada hesabının açık olduğundan emin ol.",
      "QR kodu 2 dakika içinde okut.",
      "Mobilde onay verdikten sonra web sayfasında birkaç saniye bekle.",
    ],
    cta: "QR ticket hazırla",
  },
  {
    id: "payment",
    icon: "💳",
    title: "Ödeme / dekont sorunu",
    category: "payment",
    subject: "Ödeme / dekont sorunu",
    messageTemplate:
      "Merhaba, ödeme veya dekont yükleme konusunda sorun yaşıyorum. Ödeme durumumu kontrol eder misiniz?",
    summary:
      "Dekont, banka açıklaması veya admin onayı beklemede olabilir.",
    steps: [
      "Ödeme geçmişinde sipariş durumunu kontrol et.",
      "Dekontun net yüklendiğinden emin ol.",
      "Banka açıklamasında kullanıcı/firma bilgisinin yazılı olması işleri hızlandırır.",
      "Onay bekliyorsa ticket oluştur.",
    ],
    cta: "Ödeme ticket hazırla",
  },
];

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

  if (s === "closed") {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200";
  }

  return "bg-orange-500/10 text-orange-700 dark:text-orange-200";
}

function statusLabel(status?: string | null) {
  return String(status ?? "open").toLowerCase() === "closed" ? "Kapalı" : "Açık";
}

function categoryLabel(v?: string | null) {
  const s = String(v ?? "general").toLowerCase();

  const labels: Record<string, string> = {
    general: "Genel",
    kyc: "KYC",
    premium: "Premium",
    payment: "Ödeme",
    listing: "İlan",
    chat: "Mesajlaşma",
    account: "Hesap",
    technical: "Teknik",
  };

  return labels[s] ?? s;
}

export default function SupportCenterClient() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [authed, setAuthed] = useState(false);

  const [selectedTopicId, setSelectedTopicId] = useState("premium");

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const selectedTopic = useMemo(
    () => smartTopics.find((x) => x.id === selectedTopicId) ?? smartTopics[0],
    [selectedTopicId]
  );

  const openTickets = useMemo(
    () =>
      tickets.filter(
        (x) => String(x.status ?? "open").toLowerCase() !== "closed"
      ).length,
    [tickets]
  );

  const closedTickets = useMemo(
    () =>
      tickets.filter(
        (x) => String(x.status ?? "").toLowerCase() === "closed"
      ).length,
    [tickets]
  );

  const unreadCount = useMemo(
    () =>
      tickets.reduce(
        (sum, x) => sum + Number(x.unread_user_count ?? 0),
        0
      ),
    [tickets]
  );

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
      .select(
        "id,ticket_no,subject,category,priority,status,created_at,updated_at,last_message_preview,unread_user_count"
      )
      .eq("user_id", uid)
      .order("last_message_at", {
        ascending: false,
        nullsFirst: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (!error) {
      setTickets((data ?? []) as Ticket[]);
    }

    setLoading(false);
  }

  function applySmartTopic(topic: SmartTopic) {
    setSelectedTopicId(topic.id);
    setCategory(topic.category);
    setSubject(topic.subject);
    setMessage(topic.messageTemplate);

    const el = document.getElementById("ticket-form");
    el?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
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
      const { error } = await supabase.from("support_tickets").insert({
        user_id: uid,
        subject: subject.trim(),
        category,
        message: message.trim(),
        status: "open",
        priority: selectedTopic?.id === "payment" ? "high" : "normal",
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

    const channel = supabase
      .channel("user-support-center-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_tickets",
        },
        () => {
          loadTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <section className="relative overflow-hidden rounded-[40px] border border-black/10 bg-white/80 p-6 shadow-[0_30px_120px_rgba(0,0,0,.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.045] sm:p-10">
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-700 dark:text-emerald-200">
              HALAPP AKILLI DESTEK MERKEZİ
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-6xl">
              Ticket açmadan önce çözümü birlikte bulalım.
            </h1>

            <p className="mt-4 max-w-3xl text-sm font-semibold leading-relaxed text-zinc-600 dark:text-white/60 sm:text-lg">
              Premium, KYC, ilan, ödeme, QR giriş ve mesaj sorunları için önce hızlı
              çözüm önerilerini gösteririz. Çözülmezse ticket oluşturup cevabı canlı
              takip edebilirsin.
            </p>
          </div>

          <div className="lg:col-span-4">
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Açık" value={openTickets} />
              <MiniStat label="Kapalı" value={closedTickets} />
              <MiniStat label="Yeni" value={unreadCount} />
            </div>
          </div>
        </div>
      </section>

      {!authed && !loading ? (
        <section className="mt-8 rounded-[34px] border border-orange-500/20 bg-orange-500/10 p-6">
          <div className="text-xl font-black text-zinc-950 dark:text-white">
            Akıllı destek ve ticket geçmişi için giriş yapmalısın.
          </div>

          <Link
            href={`/auth?next=${encodeURIComponent("/support")}`}
            className="mt-5 inline-flex rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-black"
          >
            Giriş Yap
          </Link>
        </section>
      ) : (
        <>
          <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {smartTopics.map((topic) => {
              const active = topic.id === selectedTopic.id;

              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={[
                    "group relative overflow-hidden rounded-[30px] border p-5 text-left shadow-[0_20px_80px_rgba(0,0,0,.055)] backdrop-blur-xl transition hover:-translate-y-1",
                    active
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : "border-black/10 bg-white/78 hover:bg-white dark:border-white/10 dark:bg-white/[0.045] dark:hover:bg-white/[0.07]",
                  ].join(" ")}
                >
                  <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl opacity-0 transition group-hover:opacity-100" />

                  <div className="relative">
                    <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-emerald-500/10 text-3xl">
                      {topic.icon}
                    </div>

                    <h3 className="mt-4 text-lg font-black text-zinc-950 dark:text-white">
                      {topic.title}
                    </h3>

                    <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/55">
                      {topic.summary}
                    </p>

                    <div className="mt-4 text-xs font-black text-emerald-700 dark:text-emerald-300">
                      Çözüm adımlarını gör →
                    </div>
                  </div>
                </button>
              );
            })}
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="sticky top-24 rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-[0_24px_90px_rgba(0,0,0,.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045]">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-emerald-500/10 text-3xl">
                    {selectedTopic.icon}
                  </div>

                  <div>
                    <div className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                      Akıllı çözüm önerisi
                    </div>

                    <h2 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">
                      {selectedTopic.title}
                    </h2>
                  </div>
                </div>

                <p className="mt-4 text-sm font-semibold leading-relaxed text-zinc-600 dark:text-white/60">
                  {selectedTopic.summary}
                </p>

                <div className="mt-5 space-y-3">
                  {selectedTopic.steps.map((step, i) => (
                    <div
                      key={step}
                      className="flex gap-3 rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-black">
                        {i + 1}
                      </div>

                      <div className="text-sm font-semibold leading-6 text-zinc-700 dark:text-white/70">
                        {step}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => applySmartTopic(selectedTopic)}
                  className="mt-5 h-13 w-full rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-black shadow-[0_20px_60px_rgba(34,197,94,.22)] transition hover:bg-emerald-400"
                >
                  Çözülmedi, {selectedTopic.cta}
                </button>
              </div>
            </div>

            <div className="space-y-6 lg:col-span-7">
              <form
                id="ticket-form"
                onSubmit={createTicket}
                className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-[0_24px_90px_rgba(0,0,0,.06)] dark:border-white/10 dark:bg-white/[0.045]"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-zinc-950 dark:text-white">
                      Destek Talebi Oluştur
                    </h2>

                    <p className="mt-1 text-sm font-semibold text-zinc-500">
                      Akıllı öneri çözmediyse ticket oluştur.
                    </p>
                  </div>

                  <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-200">
                    {categoryLabel(category)}
                  </div>
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-xs font-black text-zinc-500">
                    Konu
                  </label>

                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Örn: Premium paketim aktif olmadı"
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold outline-none transition focus:border-emerald-500/40 dark:border-white/10 dark:bg-black/20"
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-xs font-black text-zinc-500">
                    Kategori
                  </label>

                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm font-black outline-none transition focus:border-emerald-500/40 dark:border-white/10 dark:bg-black/20"
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
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-emerald-500/40 dark:border-white/10 dark:bg-black/20"
                  />
                </div>

                <button
                  disabled={sending}
                  className="mt-5 h-14 w-full rounded-2xl bg-emerald-500 text-sm font-black text-black shadow-[0_20px_60px_rgba(34,197,94,.22)] transition hover:bg-emerald-400 disabled:opacity-60"
                >
                  {sending ? "Gönderiliyor..." : "Destek Talebi Oluştur"}
                </button>
              </form>

              <div className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-[0_24px_90px_rgba(0,0,0,.06)] dark:border-white/10 dark:bg-white/[0.045]">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-black text-zinc-950 dark:text-white">
                    Taleplerim
                  </h2>

                  <div className="rounded-full bg-black/5 px-3 py-1 text-xs font-black text-zinc-500 dark:bg-white/10">
                    {tickets.length} ticket
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {loading ? (
                    <div className="rounded-2xl border border-black/10 p-6 text-center text-sm font-black text-zinc-500 dark:border-white/10">
                      Yükleniyor...
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-black/10 p-8 text-center dark:border-white/10">
                      <div className="text-4xl">🎫</div>

                      <div className="mt-3 font-black text-zinc-950 dark:text-white">
                        Henüz ticket yok
                      </div>

                      <div className="mt-1 text-sm text-zinc-500">
                        Akıllı çözüm önerilerinden sonra ilk destek talebini oluştur.
                      </div>
                    </div>
                  ) : (
                    tickets.map((t) => (
                      <Link
                        key={t.id}
                        href={`/support/${t.id}`}
                        className="group block rounded-[26px] border border-black/10 bg-white/70 p-5 transition hover:-translate-y-0.5 hover:bg-emerald-500/5 dark:border-white/10 dark:bg-white/[0.04]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                                #{t.ticket_no || t.id}
                              </div>

                              {Number(t.unread_user_count ?? 0) > 0 ? (
                                <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white">
                                  {t.unread_user_count} yeni
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-1 truncate text-lg font-black text-zinc-950 dark:text-white">
                              {t.subject}
                            </div>

                            <div className="mt-1 text-xs font-semibold text-zinc-500">
                              {categoryLabel(t.category)} • {fmt(t.created_at)}
                            </div>

                            {t.last_message_preview ? (
                              <div className="mt-2 line-clamp-1 text-sm font-semibold text-zinc-500 dark:text-white/50">
                                {t.last_message_preview}
                              </div>
                            ) : null}
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(
                              t.status
                            )}`}
                          >
                            {statusLabel(t.status)}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white/70 p-4 text-center shadow-[0_14px_50px_rgba(0,0,0,.04)] dark:border-white/10 dark:bg-white/[0.045]">
      <div className="text-2xl font-black text-zinc-950 dark:text-white">
        {value}
      </div>

      <div className="mt-1 text-xs font-black text-zinc-500">{label}</div>
    </div>
  );
}