"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useMe } from "@/lib/me";
import TurkeyHeatMap from "@/components/map/TurkeyHeatMap";

type MarketItem = {
  id: string;
  title: string;
  location: string;
  city?: string;
  price: string;
  type: string;
  emoji: string;
  coverUrl?: string;
  viewCount?: number;
  favoriteCount?: number;
  messageCount?: number;
  createdAt?: string;
};

function productEmoji(title: string) {
  const t = title.toLowerCase();

  const map: Array<[string[], string]> = [
    [["elma"], "🍎"],
    [["armut"], "🍐"],
    [["portakal", "mandalina"], "🍊"],
    [["limon"], "🍋"],
    [["muz", "banana"], "🍌"],
    [["karpuz"], "🍉"],
    [["kavun"], "🍈"],
    [["üzüm", "uzum"], "🍇"],
    [["çilek", "cilek"], "🍓"],
    [["kiraz"], "🍒"],
    [["şeftali", "seftali", "kayısı", "kayisi"], "🍑"],
    [["erik"], "🟣"],
    [["incir"], "🟤"],
    [["nar"], "🔴"],
    [["ananas"], "🍍"],
    [["avokado"], "🥑"],
    [["blue", "blueberry", "yaban"], "🫐"],
    [["ahududu", "frambuaz"], "🍓"],
    [["böğürtlen", "bogurtlen"], "🫐"],
    [["kivi"], "🥝"],
    [["mango"], "🥭"],
    [["hindistan cevizi"], "🥥"],
    [["domates"], "🍅"],
    [["salatalık", "salatalik", "kabak"], "🥒"],
    [["biber"], "🌶️"],
    [["patlıcan", "patlican"], "🍆"],
    [["havuç", "havuc"], "🥕"],
    [["patates"], "🥔"],
    [["soğan", "sogan"], "🧅"],
    [["sarımsak", "sarimsak"], "🧄"],
    [["marul", "lahana", "ıspanak", "ispanak", "roka"], "🥬"],
    [["maydanoz", "nane", "dereotu"], "🌿"],
    [["brokoli", "karnabahar"], "🥦"],
    [["mantar"], "🍄"],
    [["mısır", "misir"], "🌽"],
    [["bezelye"], "🫛"],
    [["fasulye"], "🫘"],
    [["kuşkonmaz", "kuskonmaz"], "🌱"],
    [["zencefil"], "🫚"],
  ];

  for (const [keys, emoji] of map) {
    if (keys.some((k) => t.includes(k))) return emoji;
  }

  return "🛒";
}

function formatPrice(row: any) {
  const unit = row?.unit ? ` / ${row.unit}` : "";

  if (row?.price) return `${Number(row.price).toLocaleString("tr-TR")}₺${unit}`;
  if (row?.price_per_unit) return `${Number(row.price_per_unit).toLocaleString("tr-TR")}₺${unit}`;

  if (row?.min_price || row?.max_price) {
    const min = row?.min_price ? Number(row.min_price).toLocaleString("tr-TR") : "-";
    const max = row?.max_price ? Number(row.max_price).toLocaleString("tr-TR") : "-";
    return `${min}₺ - ${max}₺`;
  }

  return "Fiyat yok";
}

function coverOf(row: any) {
  const media = Array.isArray(row?.listing_media) ? row.listing_media : [];

  if (media.length) {
    const sorted = [...media].sort(
      (a, b) => Number(a?.sort_order ?? 0) - Number(b?.sort_order ?? 0)
    );
    return sorted[0]?.thumb_url || sorted[0]?.url || "";
  }

  const mediaUrls = Array.isArray(row?.media_urls) ? row.media_urls : [];
  return mediaUrls[0] || "";
}

function StatCard({ value, label, text }: { value: string; label: string; text: string }) {
  return (
    <div className="group relative overflow-hidden rounded-[26px] border border-black/10 bg-white/75 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.06)] backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(16,185,129,.18)] dark:border-white/10 dark:bg-white/[0.055] sm:rounded-[30px]">
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl transition group-hover:bg-emerald-400/20" />
      <div className="relative text-[28px] font-black leading-none tracking-tight text-zinc-950 dark:text-white sm:text-[30px]">
        {value}
      </div>
      <div className="relative mt-3 text-[13px] font-black text-emerald-700 dark:text-emerald-300">
        {label}
      </div>
      <p className="relative mt-2 text-[12.5px] leading-relaxed text-zinc-600 dark:text-white/60">
        {text}
      </p>
    </div>
  );
}

function ExpandCard({
  icon,
  title,
  text,
  detail,
}: {
  icon: string;
  title: string;
  text: string;
  detail: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className="group relative w-full overflow-hidden rounded-[28px] border border-black/10 bg-white/75 p-5 text-left shadow-[0_24px_90px_rgba(0,0,0,0.065)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-[0_34px_120px_rgba(34,197,94,.16)] dark:border-white/10 dark:bg-white/[0.045] sm:rounded-[34px] sm:p-6"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/16 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
      </div>

      <div className="relative">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/12 text-2xl ring-1 ring-emerald-500/20 transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>

        <h3 className="mt-5 text-lg font-black text-zinc-950 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/60">{text}</p>

        <div
          className={[
            "grid transition-all duration-300",
            open ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          ].join(" ")}
        >
          <div className="overflow-hidden">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-semibold leading-relaxed text-emerald-950 dark:text-emerald-100">
              {detail}
            </div>
          </div>
        </div>

        <div className="mt-5 inline-flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-300">
          {open ? "Detayı kapat" : "Detayı gör"}
          <span>{open ? "↑" : "→"}</span>
        </div>
      </div>
    </button>
  );
}

function AccountCTA() {
  const me = useMe();

  const displayName = useMemo(() => {
    const p: any = me.profile ?? null;
    return (p?.company_name || p?.full_name || "HalApp Kullanıcısı").toString();
  }, [me.profile]);

  const avatarUrl = useMemo(() => {
    const p: any = me.profile ?? null;
    return (p?.avatar_url ?? "") as string;
  }, [me.profile]);

  if (me.loading) {
    return (
      <div className="inline-flex h-14 w-full items-center justify-center rounded-2xl border border-black/10 bg-white/70 px-7 text-sm font-black text-zinc-500 dark:border-white/10 dark:bg-white/[0.055] dark:text-white/50 sm:w-auto">
        Yükleniyor...
      </div>
    );
  }

  if (!me.authed) {
    return (
      <a
        href="/auth"
        className="inline-flex h-14 w-full items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-7 text-sm font-black text-emerald-800 transition hover:bg-emerald-500/15 dark:text-emerald-200 sm:w-auto"
      >
        Giriş Yap
      </a>
    );
  }

  return (
    <a
      href="/profile"
      className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-black/10 bg-white/70 px-4 pr-6 text-sm font-black text-zinc-900 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:hover:bg-white/[0.09] sm:w-auto"
    >
      <span className="relative h-9 w-9 overflow-hidden rounded-2xl bg-emerald-500/12 ring-1 ring-emerald-500/20">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profil" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs font-black text-emerald-700 dark:text-emerald-200">
            HA
          </span>
        )}
      </span>
      <span className="max-w-[150px] truncate">{displayName}</span>
    </a>
  );
}

function PhoneMockup3D({
  items,
  onlineUsers,
}: {
  items: MarketItem[];
  onlineUsers: number;
}) {
  const list = items.slice(0, 8);
  const first = list[0];

  const newListingText = first
    ? `${first.location || "Türkiye"} bölgesinden yeni ilan`
    : "Yeni ilan bekleniyor";

  return (
    <div className="relative mx-auto flex min-h-[560px] items-center justify-center overflow-visible sm:min-h-[640px] lg:min-h-[720px]">
      <div className="pointer-events-none absolute h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,.22),rgba(209,250,229,.18),transparent_68%)] blur-[18px] sm:h-[560px] sm:w-[560px] lg:h-[680px] lg:w-[680px]" />
      <div className="pointer-events-none absolute h-[320px] w-[320px] rounded-full bg-emerald-300/18 blur-[90px] sm:h-[520px] sm:w-[520px] sm:blur-[110px]" />

      <div className="group relative scale-[0.78] [perspective:1800px] sm:scale-[0.9] lg:scale-100">
        <div className="relative rotate-[-7deg] transition-all duration-700 [transform-style:preserve-3d] group-hover:rotate-0 group-hover:scale-[1.035]">
          <div className="pointer-events-none absolute -inset-10 animate-[premiumPhoneGlow_7s_linear_infinite] rounded-[80px] bg-[conic-gradient(from_0deg,rgba(16,185,129,.55),rgba(45,212,191,.22),rgba(255,255,255,.18),rgba(132,204,22,.38),rgba(16,185,129,.55))] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 left-1/2 h-16 w-[260px] -translate-x-1/2 rounded-full bg-black/25 blur-2xl" />

          <div className="relative h-[675px] w-[340px] overflow-hidden rounded-[58px] border-[9px] border-zinc-950 bg-zinc-950 shadow-[0_80px_190px_rgba(0,0,0,.42)]">
            <div className="absolute left-1/2 top-2 z-50 h-7 w-28 -translate-x-1/2 rounded-full bg-black shadow-[0_8px_24px_rgba(0,0,0,.45)]" />
            <div className="pointer-events-none absolute inset-0 z-40 rounded-[48px] ring-1 ring-white/10" />
            <div className="pointer-events-none absolute inset-y-24 -right-1 z-40 h-16 w-1 rounded-full bg-zinc-800" />
            <div className="pointer-events-none absolute inset-y-36 -left-1 z-40 h-20 w-1 rounded-full bg-zinc-800" />

            <div className="relative h-full overflow-hidden rounded-[48px] bg-[#f7fbf8]">
              <div className="absolute inset-x-0 top-0 h-[310px] bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-500" />
              <div className="absolute inset-x-0 top-0 h-[330px] bg-[radial-gradient(circle_at_15%_10%,rgba(255,255,255,.22),transparent_30%),radial-gradient(circle_at_90%_15%,rgba(110,231,183,.38),transparent_34%)]" />
              <div className="absolute inset-x-0 top-[250px] h-32 bg-gradient-to-b from-transparent to-[#f7fbf8]" />

              {first && (
                <Link
                  href={`/pazar/${first.id}`}
                  className="absolute left-5 right-5 top-[92px] z-50 animate-[newAlertDrop_6s_ease-in-out_infinite] rounded-[22px] border border-white/30 bg-white/95 p-3 shadow-[0_24px_70px_rgba(0,0,0,.18)] backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100">
                      🔔
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-black text-emerald-700">
                        {newListingText}
                      </div>

                      <div className="truncate text-sm font-black text-zinc-950">
                        {first.title}
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              <div className="relative z-20 px-6 pt-12">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[11px] font-black tracking-[0.32em] text-emerald-100">
                      HALAPP
                    </div>

                    <div className="mt-4 text-[34px] font-black leading-none tracking-[-0.04em] text-white">
                      Canlı Pazar
                    </div>

                    <div className="mt-2 text-sm font-bold text-white/70">
                      Türkiye geneli anlık akış
                    </div>

                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/14 px-3 py-1.5 text-[11px] font-black text-emerald-100 backdrop-blur-xl">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,.9)]" />
                      Şu an {onlineUsers} kullanıcı çevrimiçi
                    </div>
                  </div>

                  <Link
                    href="/pazar"
                    className="mt-1 flex h-16 w-16 items-center justify-center rounded-[22px] bg-white/88 text-3xl shadow-[0_18px_50px_rgba(0,0,0,.18)] backdrop-blur-xl transition hover:scale-110"
                  >
                    🛒
                  </Link>
                </div>

                <div className="mt-9 rounded-[32px] border border-white/25 bg-white/18 p-5 shadow-[0_26px_90px_rgba(0,0,0,.22)] backdrop-blur-2xl">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-black text-white/85">
                      Bugünün hareketi
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-100">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,.9)]" />
                      Canlı
                    </div>
                  </div>

                  <div className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">
                    Pazar Nabzı
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {[
                      ["📋", "İlan", "Canlı", "/pazar"],
                      ["📈", "Talep", "Anlık", "/pazar"],
                      ["📍", "Harita", "81 İl", "#live-map"],
                    ].map(([icon, a, b, href]) => (
                      <Link
                        key={a}
                        href={href}
                        className="rounded-[22px] bg-white/14 p-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.18)] transition hover:-translate-y-1 hover:bg-white/24"
                      >
                        <div className="text-2xl">{icon}</div>
                        <div className="mt-2 text-sm font-black text-white">{a}</div>
                        <div className="mt-1 text-[11px] font-bold text-white/62">{b}</div>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="mt-7 flex items-center justify-between px-1">
                  <div>
                    <div className="text-lg font-black tracking-[-0.03em] text-zinc-950">
                      Yeni gelen ürünler
                    </div>

                    <div className="text-xs font-bold text-zinc-500">
                      Fırsatları kaçırma
                    </div>
                  </div>

                  <Link
                    href="/pazar"
                    className="rounded-full bg-emerald-300 px-4 py-2 text-xs font-black text-emerald-950 shadow-[0_12px_30px_rgba(16,185,129,.22)] transition hover:scale-105 hover:bg-emerald-200"
                  >
                    Tümünü Gör
                  </Link>
                </div>

                <div className="relative mt-4 h-[250px] overflow-hidden">
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-[#f7fbf8] to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-[#f7fbf8] to-transparent" />

                  {list.length ? (
                    <div className="animate-[phoneListingFlow_16s_linear_infinite] space-y-3 hover:[animation-play-state:paused]">
                      {[...list, ...list].map((item, i) => {
                        const views = Number(item.viewCount ?? 0);
                        const fav = Number(item.favoriteCount ?? 0);
                        const msg = Number(item.messageCount ?? 0);

                        return (
                          <Link
                            key={`${item.id}-phone-flow-${i}`}
                            href={`/pazar/${item.id}`}
                            className="group/card block rounded-[24px] border border-black/5 bg-white p-3 shadow-[0_14px_44px_rgba(0,0,0,.085)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_65px_rgba(16,185,129,.20)]"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-emerald-50 text-3xl transition group-hover/card:scale-110">
                                {item.coverUrl ? (
                                  <img
                                    src={item.coverUrl}
                                    alt={item.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  item.emoji
                                )}

                                <span className="absolute right-1 top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500 ring-2 ring-white" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="truncate text-[15px] font-black text-zinc-950">
                                  {item.title}
                                </div>

                                <div className="mt-0.5 truncate text-[11px] font-black uppercase tracking-wide text-zinc-500">
                                  {item.location || "Türkiye"}
                                </div>

                                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-black text-zinc-500">
                                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                                    👁️ {views}
                                  </span>

                                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-600">
                                    ❤️ {fav}
                                  </span>

                                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-600">
                                    💬 {msg}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="whitespace-nowrap text-[12px] font-black text-emerald-700">
                                  {item.price}
                                </div>

                                <div className="mt-1 text-[11px] font-bold text-zinc-500 group-hover/card:text-emerald-600">
                                  Aç →
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-black/5 bg-white p-5 text-center shadow-[0_14px_44px_rgba(0,0,0,.085)]">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">
                        🛒
                      </div>

                      <div className="mt-3 text-sm font-black text-zinc-950">
                        Canlı ilanlar yükleniyor...
                      </div>

                      <div className="mt-1 text-xs font-bold text-zinc-500">
                        HalApp pazar akışı hazırlanıyor
                      </div>
                    </div>
                  )}
                </div>

                <div className="absolute inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white/86 px-5 py-4 backdrop-blur-2xl">
                  <div className="grid grid-cols-5 items-center text-center">
                    {[
                      ["🏠", "Pazar", "/pazar"],
                      ["📍", "Harita", "#live-map"],
                      ["＋", "", "/pazar"],
                      ["📄", "İlanlarım", "/profile"],
                      ["👤", "Profil", "/profile"],
                    ].map(([icon, label, href], i) => (
                      <Link
                        key={`${icon}-${i}`}
                        href={href}
                        className={[
                          "flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition hover:text-emerald-700",
                          i === 2 ? "-mt-8" : "text-zinc-500",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "flex items-center justify-center",
                            i === 2
                              ? "h-14 w-14 rounded-full bg-emerald-700 text-3xl text-white shadow-[0_18px_40px_rgba(4,120,87,.32)]"
                              : "text-xl",
                          ].join(" ")}
                        >
                          {icon}
                        </span>

                        {label && <span>{label}</span>}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes phoneListingFlow {
              0% {
                transform: translateY(0);
              }
              100% {
                transform: translateY(-50%);
              }
            }

            @keyframes newAlertDrop {
              0%, 18% {
                opacity: 0;
                transform: translateY(-28px) scale(0.96);
              }
              26%, 72% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
              82%, 100% {
                opacity: 0;
                transform: translateY(-18px) scale(0.98);
              }
            }

            @keyframes premiumPhoneGlow {
              0% {
                transform: rotate(0deg) scale(1);
                opacity: 0.75;
              }

              50% {
                transform: rotate(180deg) scale(1.06);
                opacity: 1;
              }

              100% {
                transform: rotate(360deg) scale(1);
                opacity: 0.75;
              }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}

function MarketFlowCard({ item, index }: { item: MarketItem; index: number }) {
  return (
    <Link
      href={`/pazar/${item.id}`}
      className="group flex items-center gap-4 rounded-[26px] border border-black/10 bg-white/75 p-4 shadow-[0_14px_45px_rgba(0,0,0,.07)] backdrop-blur-xl transition hover:scale-[1.015] hover:bg-white dark:border-white/10 dark:bg-white/[0.07] dark:hover:bg-white/[0.11]"
    >
      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[22px] bg-emerald-500/10 text-2xl ring-1 ring-emerald-500/15">
        {item.coverUrl ? (
          <img src={item.coverUrl} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          item.emoji
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/12 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:text-emerald-200">
            {item.type}
          </span>

          {index < 2 && (
            <span className="rounded-full bg-orange-400/12 px-2.5 py-1 text-[10px] font-black text-orange-700 dark:text-orange-200">
              Yeni
            </span>
          )}
        </div>

        <div className="mt-1 truncate text-base font-black text-zinc-950 dark:text-white">
          {item.title}
        </div>

        <div className="truncate text-xs font-semibold text-zinc-500 dark:text-white/45">
          {item.location || "Konum belirtilmedi"}
        </div>
      </div>

      <div className="text-right">
        <div className="rounded-full bg-emerald-500/12 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-200">
          {item.price}
        </div>
        <div className="mt-2 text-[11px] font-black text-zinc-400 transition group-hover:text-emerald-600 dark:text-white/40 dark:group-hover:text-emerald-200">
          Detay →
        </div>
      </div>
    </Link>
  );
}

function HeroMarketPreview({ items }: { items: MarketItem[] }) {
  const list = items.length ? [...items, ...items] : [];

  return (
    <div className="relative hidden lg:block">
      <div className="absolute -inset-6 rounded-[44px] bg-emerald-500/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-[38px] border border-black/10 bg-white/75 p-5 shadow-[0_30px_120px_rgba(0,0,0,.10)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-black text-zinc-950 dark:text-white">
              Canlı Pazar
            </div>
            <div className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/45">
              Gerçek ilan akışı
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-black text-emerald-700 dark:text-emerald-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            LIVE
          </div>
        </div>

        <div className="relative mt-5 h-[420px] overflow-hidden">
          <div className="absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-white to-transparent dark:from-[#101916]" />
          <div className="absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-white to-transparent dark:from-[#101916]" />

          {list.length ? (
            <div className="animate-[heroMarketFlow_18s_linear_infinite] space-y-3">
              {list.map((item, i) => (
                <MarketFlowCard key={`${item.id}-hero-${i}`} item={item} index={i} />
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-[28px] border border-black/10 bg-white/60 text-sm font-black text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50">
              Canlı ilanlar yükleniyor...
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes heroMarketFlow {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
      `}</style>
    </div>
  );
}

function HowItWorksSection() {
  const steps = [
    ["1", "İlan Ver", "Ürününü fotoğraf, video, fiyat ve şehir bilgisiyle yayınla."],
    ["2", "Alıcılar Görsün", "Türkiye genelindeki alıcılar ürününe veya talebine ulaşsın."],
    ["3", "Mesajlaş", "Uygulama içinden satıcı veya alıcıyla direkt bağlantı kur."],
    ["4", "Ticaret Yap", "Anlaşmanı tamamla, pazar hareketini canlı takip et."],
  ];

  return (
    <section className="mt-16">
      <div className="mb-7">
        <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-200">
          HALAPP NASIL ÇALIŞIR?
        </div>

        <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
          Ürünü pazara çıkarmak artık çok daha hızlı.
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {steps.map(([no, title, text]) => (
          <div
            key={no}
            className="group relative overflow-hidden rounded-[32px] border border-black/10 bg-white/75 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.06)] backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-[0_32px_120px_rgba(34,197,94,.15)] dark:border-white/10 dark:bg-white/[0.045]"
          >
            <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-emerald-500/12 blur-3xl opacity-0 transition group-hover:opacity-100" />
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-xl font-black text-black shadow-lg shadow-emerald-500/25">
                {no}
              </div>
              <h3 className="mt-5 text-lg font-black text-zinc-950 dark:text-white">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/60">
                {text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PriceMovementSection({ items }: { items: MarketItem[] }) {
  const rows = useMemo(() => {
    return items.slice(0, 6).map((i) => ({
      id: i.id,
      emoji: i.emoji,
      title: i.title,
      location: i.location || "Türkiye",
      href: `/pazar/${i.id}`,
    }));
  }, [items]);

  return (
    <section className="mt-16">
      <div className="relative overflow-hidden rounded-[34px] border border-black/10 bg-white/78 p-5 shadow-[0_30px_120px_rgba(0,0,0,0.09)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.045] sm:rounded-[46px] sm:p-10">
        <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-orange-400/10 blur-3xl" />
        <div className="absolute -bottom-28 left-1/4 h-80 w-80 rounded-full bg-emerald-400/12 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1 text-xs font-black text-orange-700 dark:text-orange-200">
              SON PAZAR HAREKETLERİ
            </div>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
              Ürün akışı canlı, fırsatlar anlık.
            </h2>

            <p className="mt-2 max-w-2xl text-zinc-600 dark:text-white/60">
              Yeni gelen ilanlar ve talepler tıklanabilir canlı kartlarla pazara akar.
            </p>
          </div>

          <a
            href="/pazar"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-black shadow-[0_22px_70px_rgba(34,197,94,.25)] transition hover:scale-[1.02] hover:bg-emerald-400 sm:w-auto"
          >
            Canlı Pazarı Aç →
          </a>
        </div>

        <div className="relative mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.length ? (
            rows.map((item, i) => (
              <Link
                key={item.id}
                href={item.href}
                className="group relative overflow-hidden rounded-[30px] border border-black/10 bg-white/78 p-5 shadow-[0_18px_70px_rgba(0,0,0,.07)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-[0_30px_110px_rgba(34,197,94,.16)] dark:border-white/10 dark:bg-white/[0.05]"
              >
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl opacity-0 transition group-hover:opacity-100" />

                <div className="relative flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-3xl ring-1 ring-emerald-500/15 transition group-hover:scale-110">
                    {item.emoji}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-black text-zinc-950 dark:text-white">
                      {item.title}
                    </div>
                    <div className="mt-1 truncate text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-white/45">
                      {item.location}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">
                      Yeni
                    </div>
                    <div className="mt-2 text-[11px] font-black text-zinc-400 group-hover:text-emerald-600">
                      Detay →
                    </div>
                  </div>
                </div>

                <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-300 transition-all duration-700 group-hover:w-full"
                    style={{ width: `${45 + i * 8}%` }}
                  />
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-[28px] border border-black/10 bg-white/70 p-6 text-sm font-black text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50">
              Pazar akışı yükleniyor...
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function HomeClient() {
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [onlineUsers, setOnlineUsers] = useState(0);

  useEffect(() => {
    let alive = true;

    async function touchLastSeen() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) return;

      await supabase
        .from("profiles")
        .update({ last_seen: new Date().toISOString() })
        .eq("id", user.id);
    }

    async function loadOnlineUsers() {
      const { data, error } = await supabase.rpc("get_online_user_count");

      if (!alive) return;

      if (error) {
        console.log("online user count error:", error.message);
        setOnlineUsers(0);
        return;
      }

      setOnlineUsers(Number(data ?? 0));
    }

    async function loadMarketItems() {
      const { data, error } = await supabase.rpc("get_home_market_items", {
        limit_count: 40,
      });

      if (!alive) return;

      if (error) {
        console.log("home live market rpc error:", error.message);
        setMarketItems([]);
        return;
      }

      const rows: MarketItem[] = (Array.isArray(data) ? data : []).map((row: any) => {
        const title = row.product_name || row.title || "İlan";

        return {
          id: row.id,
          title,
          city: row.city || "",
          location: [row.city, row.district].filter(Boolean).join(" / "),
          price: row.post_type === "request" ? "Talep" : formatPrice(row),
          type: row.post_type === "request" ? "Talep" : "Ürün",
          emoji: productEmoji(title),
          coverUrl: coverOf(row),
          viewCount: Number(row.view_count ?? 0),
          favoriteCount: Number(row.favorite_count ?? 0),
          messageCount: Number(row.message_count ?? 0),
          createdAt: row.created_at ?? "",
        };
      });

      setMarketItems(rows);
    }

    touchLastSeen();
    loadOnlineUsers();
    loadMarketItems();

    const heartbeatTimer = window.setInterval(() => {
      touchLastSeen();
      loadOnlineUsers();
    }, 60000);

    const onlineTimer = window.setInterval(loadOnlineUsers, 30000);

    const ch = supabase
      .channel("home-live-market")
      .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, () =>
        loadMarketItems()
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "favorites" }, () =>
        loadMarketItems()
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () =>
        loadOnlineUsers()
      )
      .subscribe();

    return () => {
      alive = false;
      window.clearInterval(heartbeatTimer);
      window.clearInterval(onlineTimer);
      supabase.removeChannel(ch);
    };
  }, []);

  return (
    <main className="relative w-full max-w-full overflow-x-clip">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-[760px] w-[760px] -translate-x-1/2 rounded-full bg-emerald-500/14 blur-[150px]" />
        <div className="absolute right-[-220px] top-[220px] h-[620px] w-[620px] rounded-full bg-cyan-400/12 blur-[150px]" />
        <div className="absolute bottom-[180px] left-[-190px] h-[620px] w-[620px] rounded-full bg-lime-400/10 blur-[150px]" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <section className="relative overflow-hidden rounded-[30px] border border-black/10 bg-white/78 p-4 shadow-[0_28px_100px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.045] sm:rounded-[42px] sm:p-8 lg:p-12">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-emerald-500/18 blur-3xl" />
            <div className="absolute -bottom-40 left-1/3 h-[520px] w-[520px] rounded-full bg-cyan-400/12 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,.10),transparent_35%),radial-gradient(circle_at_90%_70%,rgba(45,212,191,.08),transparent_34%)]" />
          </div>

          <div className="relative grid gap-6 lg:grid-cols-12 lg:items-center lg:gap-12">
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-700 shadow-sm dark:text-emerald-200">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(34,197,94,.9)]" />
                Türkiye’nin Dijital Hali — HalApp
              </div>

              <h1 className="mt-6 max-w-5xl text-[36px] font-black leading-[1.02] tracking-[-0.045em] text-zinc-950 dark:text-white sm:text-6xl lg:text-[70px]">
                Hal ticaretinde{" "}
                <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-lime-500 bg-clip-text text-transparent dark:from-emerald-300 dark:via-teal-200 dark:to-lime-200">
                  yeni dönem
                </span>{" "}
                başladı.
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-relaxed text-zinc-600 dark:text-white/68 sm:text-xl">
                Üretici, tüccar, halci, komisyoncu ve ihracatçı tek canlı pazarda buluşur.
                İlanlar, talepler, şehir sinyalleri ve pazar hareketi HalApp ile anlık takip edilir.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href="/pazar"
                  className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-emerald-500 px-7 text-sm font-black text-black shadow-[0_28px_80px_rgba(34,197,94,.32)] transition hover:scale-[1.02] hover:bg-emerald-400 sm:w-auto"
                >
                  Canlı Pazarı Aç →
                </a>

                <AccountCTA />

                <a
                  href="#live-map"
                  className="inline-flex h-14 w-full items-center justify-center rounded-2xl border border-black/10 bg-white/70 px-7 text-sm font-black text-zinc-950 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.055] dark:text-white sm:w-auto"
                >
                  Türkiye Haritasını Gör
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <StatCard value="81" label="İl Kapsamı" text="Türkiye genelinde canlı pazar hareketi." />
                <StatCard value="Canlı" label="İlan Akışı" text="Yeni ürün ve talepler anlık görünür." />
                <StatCard value="Güven" label="Satıcı Profili" text="Daha net, daha takip edilebilir ticaret." />
                <StatCard value="Hızlı" label="Bağlantı" text="Alıcı ve satıcıya saniyeler içinde ulaş." />
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="-mt-6 sm:mt-0">
                <PhoneMockup3D items={marketItems} onlineUsers={onlineUsers} />
              </div>
            </div>
          </div>
        </section>

        <section id="trust" className="mt-14">
          <div className="grid gap-5 md:grid-cols-3">
            <ExpandCard icon="✅" title="Onaylı Satıcı" text="Profil ve satıcı bilgileriyle daha güven veren ticaret deneyimi." detail="Onaylı satıcı yapısı sayesinde alıcılar satıcı profilini daha ciddi görür. Firma bilgileri, profil görünümü ve ilan düzeni güven algısını artırır." />
            <ExpandCard icon="🛡️" title="Güvenli Ticaret" text="Alıcı ve satıcıyı tek platformda daha kontrollü şekilde buluşturur." detail="HalApp, ilanları düzenli ve takip edilebilir hale getirir. Kullanıcılar ürün, şehir, fiyat ve satıcı bilgilerini daha net görerek daha bilinçli ticaret yapar." />
            <ExpandCard icon="📌" title="Gerçek Pazar Akışı" text="Aktif ilan, talep ve şehir sinyalleri tek ekranda takip edilir." detail="Canlı ilan akışı gerçek pazar hareketini gösterir. Yeni ürünler, talepler ve fiyat bilgileri güncel olarak takip edilebilir." />
          </div>
        </section>

        <section id="features" className="mt-16">
          <div className="mb-7">
            <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-200">
              KİMLER İÇİN?
            </div>

            <h2 className="mt-3 max-w-4xl text-3xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
              HalApp, tarım ticaretinin bütün taraflarını aynı canlı pazarda buluşturur.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <ExpandCard icon="🌱" title="Üretici" text="Ürününü daha fazla alıcıya göster, pazar hareketini takip et." detail="Üretici, ürününü sadece çevresine değil daha geniş alıcı ağına gösterebilir. Piyasa hareketini takip ederek doğru zamanda doğru satış yapabilir." />
            <ExpandCard icon="🏪" title="Hal & Komisyoncu" text="Güncel ilan akışıyla alıcı ve satıcı bağlantısını hızlandır." detail="Hal ve komisyoncular için HalApp; ürün akışını, satıcı bağlantılarını ve talep hareketlerini tek ekranda yönetilebilir hale getirir." />
            <ExpandCard icon="🚚" title="Tüccar" text="Şehir, ürün ve fiyat bilgileriyle doğru fırsatı daha hızlı bul." detail="Tüccar, farklı şehirlerdeki ürünleri ve fiyatları hızlıca görerek fırsatları kaçırmadan doğru satıcıya ulaşabilir." />
            <ExpandCard icon="🌍" title="İhracatçı" text="Kaliteli ürün, doğru satıcı ve güncel piyasa bilgisine ulaş." detail="İhracatçı için HalApp; kaliteli ürün arama, güven veren satıcı bulma ve piyasa takibi açısından güçlü bir dijital pazar alanı sağlar." />
          </div>
        </section>

        <TurkeyHeatMap />

        <HowItWorksSection />

        <PriceMovementSection items={marketItems} />

        <section className="mt-16 overflow-hidden rounded-[34px] border border-emerald-500/15 bg-gradient-to-br from-emerald-950 via-zinc-950 to-slate-950 p-6 text-white shadow-[0_34px_140px_rgba(0,0,0,.22)] sm:rounded-[42px] sm:p-10">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">
                HALAPP WEB
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Pazar artık sadece halde değil, tüm Türkiye’nin ekranında.
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/60 sm:text-base">
                HalApp; ürün, talep, satıcı profili, şehir sinyali ve canlı pazar hareketini
                tek bir modern platformda birleştirir.
              </p>
            </div>

            <div className="lg:col-span-4">
              <a
                href="/pazar"
                className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-emerald-400 px-7 text-sm font-black text-black shadow-[0_24px_80px_rgba(52,211,153,.28)] transition hover:scale-[1.02] hover:bg-emerald-300"
              >
                HalApp Pazarına Gir →
              </a>
            </div>
          </div>
        </section>

        <footer className="mt-16 rounded-[30px] border border-black/10 bg-white/75 p-6 shadow-[0_18px_80px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] sm:rounded-[34px] sm:p-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="text-xl font-black text-zinc-950 dark:text-white">HalApp</div>
              <p className="mt-2 text-sm text-zinc-600 dark:text-white/60">
                Türkiye’nin dijital hal ve canlı pazar platformu.
              </p>
            </div>

            <div>
              <div className="font-black text-zinc-950 dark:text-white">Platform</div>
              <div className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-white/60">
                <a href="/pazar" className="block hover:text-emerald-600">Pazar</a>
                <a href="#live-map" className="block hover:text-emerald-600">Canlı Harita</a>
                <a href="/favorites" className="block hover:text-emerald-600">Favoriler</a>
              </div>
            </div>

            <div>
              <div className="font-black text-zinc-950 dark:text-white">Yasal</div>
              <div className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-white/60">
                <a href="/privacy" className="block hover:text-emerald-600">KVKK & Gizlilik</a>
                <a href="/terms" className="block hover:text-emerald-600">Kullanım Koşulları</a>
              </div>
            </div>

            <div>
              <div className="font-black text-zinc-950 dark:text-white">Destek</div>
              <div className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-white/60">
                <a href="/support" className="block hover:text-emerald-600">Destek Merkezi</a>
                <a href="mailto:destek@halapp.com" className="block hover:text-emerald-600">destek@halapp.app</a>
                <span className="block">Instagram • LinkedIn</span>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-black/10 pt-5 text-xs font-semibold text-zinc-500 dark:border-white/10 dark:text-white/45">
            ©️ 2026 HalApp • Tüm hakları saklıdır.
          </div>
        </footer>
      </div>
    </main>
  );
}