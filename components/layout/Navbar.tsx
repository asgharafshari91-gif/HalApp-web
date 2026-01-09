"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/app/providers";
import { useToast } from "@/components/ui/toast";
import { useMe } from "@/lib/me";
import { supabase } from "@/lib/supabaseClient";

const nav = [
  { href: "#ozellikler", label: "Özellikler" },
  { href: "#canli-ilanlar", label: "Canlı İlanlar" },
  { href: "#fiyat", label: "Fiyat" },
];

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function bust(url: string) {
  if (!url) return "";
  const hasQ = url.includes("?");
  return `${url}${hasQ ? "&" : "?"}t=${Date.now()}`;
}

function initials(name?: string | null) {
  const v = (name ?? "").trim();
  if (!v) return "HA";
  const parts = v.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "HA";
}

/** ✅ Home dışındayken anchor doğru link olsun: "/#ozellikler" */
function anchorHref(onHome: boolean, hash: string) {
  return onHome ? hash : `/${hash}`;
}

function Icon({ name }: { name: string }) {
  // minimal inline icon set
  if (name === "settings")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-80">
        <path
          d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M19.4 15a7.9 7.9 0 0 0 .1-6l-2.1.3a6.2 6.2 0 0 0-1.2-1.2l.3-2.1a7.9 7.9 0 0 0-6-.1l-.3 2.1a6.2 6.2 0 0 0-1.2 1.2L5.6 9a7.9 7.9 0 0 0-.1 6l2.1-.3c.36.45.77.86 1.22 1.22l-.3 2.1a7.9 7.9 0 0 0 6 .1l.3-2.1c.45-.36.86-.77 1.22-1.22l2.1.3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );

  if (name === "bell")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-80">
        <path
          d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" />
      </svg>
    );

  if (name === "user")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-80">
        <path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    );

  if (name === "heart")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-80">
        <path
          d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );

  if (name === "shop")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-80">
        <path d="M3 9l1-5h16l1 5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M5 9v11h14V9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M9 20v-7h6v7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );

  if (name === "chat")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-80">
        <path
          d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );

  if (name === "tag")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-80">
        <path
          d="M20.6 13.2 12 21.8 2.2 12V2.2H12l8.6 8.6a3 3 0 0 1 0 2.4Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M7 7h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );

  if (name === "shield")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-80">
        <path
          d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 12l1.8 1.8L15.8 9.3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

  return null;
}

function ThemeButton({
  onClick,
  theme,
  className = "",
}: {
  onClick: () => void;
  theme: "light" | "dark";
  className?: string;
}) {
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/60 px-3 py-2 text-sm font-extrabold text-black/80 shadow-sm hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10",
        className
      )}
      aria-label="Tema Değiştir"
      title="Tema"
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 13.2A8.4 8.4 0 0 1 10.8 3a6.8 6.8 0 1 0 10.2 10.2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
      <span className="hidden sm:inline">{isDark ? "Gece" : "Gündüz"}</span>
    </button>
  );
}

function PremiumPill() {
  return (
    <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black text-emerald-800 dark:text-emerald-200">
      Premium
    </span>
  );
}

function UnreadBadge({ n }: { n: number }) {
  if (!n || n <= 0) return null;
  const shown = n > 99 ? "99+" : String(n);
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-black text-white">
      {shown}
    </span>
  );
}

function UserChip({
  name,
  avatarUrl,
  isPremium,
}: {
  name: string;
  avatarUrl?: string | null;
  isPremium?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-black/5 px-3 py-2 dark:border-white/10 dark:bg-white/5">
      <div className="relative h-8 w-8 overflow-hidden rounded-2xl ring-1 ring-black/10 bg-white/70 dark:ring-white/10 dark:bg-black/25">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bust(avatarUrl)} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] font-black text-black/70 dark:text-white/75">
            {initials(name)}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="max-w-[160px] truncate text-xs font-extrabold text-black/90 dark:text-white/90">
          {name}
        </div>
        <div className="text-[11px] text-black/55 dark:text-white/55">{isPremium ? "Premium üye" : "Standart üye"}</div>
      </div>

      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-70">
        <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function MenuItem({
  icon,
  title,
  subtitle,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx("w-full rounded-2xl px-3 py-2 text-left transition", "hover:bg-black/5 dark:hover:bg-white/5")}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-2xl border border-black/10 bg-white/70 text-black/80 dark:border-white/10 dark:bg-black/30 dark:text-white/80">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-sm font-extrabold text-black/85 dark:text-white/85">{title}</div>
            {badge ? <div className="shrink-0">{badge}</div> : null}
          </div>
          {subtitle ? <div className="mt-0.5 truncate text-[11px] text-black/55 dark:text-white/55">{subtitle}</div> : null}
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-50">
          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </button>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const [scrolled, setScrolled] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);

  const [openUser, setOpenUser] = useState(false);
  const userRef = useRef<HTMLDivElement | null>(null);

  const { theme, toggleTheme } = useTheme();
  const me = useMe();

  const onHome = pathname === "/";

  const displayName = useMemo(() => {
    const p: any = me.profile ?? null;
    const c = (p?.company_name ?? "").trim();
    const f = (p?.full_name ?? "").trim();
    return c || f || "HalApp Kullanıcısı";
  }, [me.profile]);

  const avatarUrl = useMemo(() => {
    const p: any = me.profile ?? null;
    return (p?.avatar_url ?? null) as string | null;
  }, [me.profile]);

  const isPremium = Boolean((me.profile as any)?.is_premium);

  // ✅ ADMIN (me.profile varsa oradan, yoksa DB’den)
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const v = Boolean((me.profile as any)?.is_admin);
    if (v) setIsAdmin(true);
  }, [me.profile]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (isAdmin) return; // zaten true
      if (!me.authed) {
        if (mounted) setIsAdmin(false);
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) return;

      const { data, error } = await supabase.from("profiles").select("is_admin").eq("id", uid).maybeSingle();
      if (!mounted) return;
      if (!error) setIsAdmin(Boolean((data as any)?.is_admin));
    })();
    return () => {
      mounted = false;
    };
  }, [me.authed, isAdmin]);

  // ✅ unread state
  const [myId, setMyId] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = openMobile ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [openMobile]);

  // dışarı tıklayınca dropdown kapat
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!openUser) return;
      const el = userRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpenUser(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [openUser]);

  // ✅ route değişince menüler kapansın
  useEffect(() => {
    setOpenMobile(false);
    setOpenUser(false);
  }, [pathname]);

  // ✅ session -> myId
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;
      if (!mounted) return;
      setMyId(uid);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setMyId(session?.user?.id ?? null);
      if (!session?.user?.id) setUnread(0);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function loadUnreadCount(uid: string) {
    const { count, error } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("to_user", uid)
      .eq("is_read", false);

    if (error) return;
    setUnread(count ?? 0);
  }

  // ✅ unread initial + realtime
  useEffect(() => {
    if (!myId) return;

    loadUnreadCount(myId);

    const ch = supabase
      .channel(`unread-${myId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) => {
        const row: any = payload.new ?? payload.old ?? null;
        if (row?.to_user && row.to_user !== myId) return;
        loadUnreadCount(myId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [myId]);

  async function goLogin() {
    const next = pathname || "/";
    router.push(`/auth?next=${encodeURIComponent(next)}`);
  }

  async function logout() {
    try {
      await me.signOut();
      toast({ variant: "info", title: "Çıkış", message: "Oturum kapatıldı." });
      setOpenUser(false);
      setUnread(0);
      setIsAdmin(false);
      router.push("/");
    } catch (e: any) {
      toast({ variant: "error", title: "Çıkış yapılamadı", message: e?.message ?? "Bir hata oluştu." });
    }
  }

  const desktopLinkCls =
    "px-3 py-2 text-sm font-semibold text-black/65 hover:text-black/90 dark:text-white/70 dark:hover:text-white/95 transition";

  return (
    <>
      <header
        className={clsx(
          "sticky top-0 z-50 w-full",
          "transition-all duration-300",
          scrolled ? "backdrop-blur-xl" : "backdrop-blur-md"
        )}
      >
        <div
          className={clsx(
            "mx-auto max-w-6xl px-4",
            "border-b",
            scrolled
              ? "border-black/10 bg-white/70 dark:border-white/10 dark:bg-black/35"
              : "border-black/5 bg-white/40 dark:border-white/5 dark:bg-black/20"
          )}
        >
          <div className="flex h-16 items-center justify-between">
            {/* Left: Brand */}
            <Link href="/" className="group flex items-center gap-3">
              <span className="relative h-10 w-10 overflow-hidden rounded-2xl ring-1 ring-black/10 dark:ring-white/10">
                <Image src="/halapp-logo.png" alt="HalApp" fill className="object-cover" priority />
                <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="absolute -inset-8 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,.35),transparent_55%)]" />
                </span>
              </span>

              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold tracking-tight text-black/90 dark:text-white/95">HalApp</span>
                  <PremiumPill />
                </div>
                <div className="text-[12px] text-black/55 dark:text-white/55">Hızlı • Güvenli • Canlı akış</div>
              </div>
            </Link>

            {/* Center: Nav */}
            <nav className="hidden items-center gap-1 md:flex">
              {nav.map((x) => (
                <a key={x.href} href={anchorHref(onHome, x.href)} className={desktopLinkCls}>
                  {x.label}
                </a>
              ))}

              <Link href="/pazar" className={desktopLinkCls}>
                Pazar
              </Link>
              <Link href="/favorites" className={desktopLinkCls}>
                Favoriler
              </Link>

              <Link href="/conversations" className={desktopLinkCls}>
                Mesajlar <UnreadBadge n={unread} />
              </Link>
            </nav>

            {/* Right: Actions */}
            <div className="hidden items-center gap-2 md:flex">
              <ThemeButton onClick={toggleTheme} theme={theme} />

              {me.loading ? (
                <div className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                  Yükleniyor…
                </div>
              ) : me.authed ? (
                <div className="relative" ref={userRef}>
                  <button
                    type="button"
                    onClick={() => setOpenUser((s) => !s)}
                    className="transition hover:opacity-95"
                    aria-label="Profil menüsü"
                  >
                    <UserChip name={displayName} avatarUrl={avatarUrl} isPremium={isPremium} />
                  </button>

                  {openUser && (
                    <div className="absolute right-0 mt-2 w-[320px] overflow-hidden rounded-[28px] border border-black/10 bg-white/95 shadow-[0_20px_80px_rgba(0,0,0,0.18)] dark:border-white/10 dark:bg-zinc-950/95">
                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 overflow-hidden rounded-2xl ring-1 ring-black/10 bg-white/70 dark:ring-white/10 dark:bg-black/25">
                            {avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={bust(avatarUrl)} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-black text-black/70 dark:text-white/75">
                                {initials(displayName)}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-black text-black/90 dark:text-white/90">{displayName}</div>
                            <div className="mt-0.5 flex flex-wrap gap-2">
                              <span className="inline-flex items-center rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-[11px] font-extrabold text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                                {isPremium ? "Premium" : "Standart"}
                              </span>
                              {(me.profile as any)?.verified ? (
                                <span className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-200">
                                  Onaylı
                                </span>
                              ) : null}
                              {isAdmin ? (
                                <span className="inline-flex items-center rounded-full border border-rose-500/25 bg-rose-500/10 px-2.5 py-1 text-[11px] font-extrabold text-rose-800 dark:text-rose-200">
                                  Admin
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 h-px bg-black/10 dark:bg-white/10" />

                        <div className="mt-3 grid gap-1">
                          <MenuItem
                            icon={<Icon name="user" />}
                            title="Profil"
                            subtitle="Hesap ve profil bilgileri"
                            onClick={() => {
                              setOpenUser(false);
                              router.push("/profile");
                            }}
                          />
                          <MenuItem
                            icon={<Icon name="chat" />}
                            title="Mesajlar"
                            subtitle="Sohbetler ve talepler"
                            badge={<UnreadBadge n={unread} />}
                            onClick={() => {
                              setOpenUser(false);
                              router.push("/conversations");
                            }}
                          />
                          <MenuItem
                            icon={<Icon name="tag" />}
                            title="İlanlarım"
                            subtitle="Yayınlanan ilanlar"
                            onClick={() => {
                              setOpenUser(false);
                              router.push("/my-listings");
                            }}
                          />
                          <MenuItem
                            icon={<Icon name="heart" />}
                            title="Favoriler"
                            subtitle="Kaydedilen ilanlar"
                            onClick={() => {
                              setOpenUser(false);
                              router.push("/favorites");
                            }}
                          />
                          <MenuItem
                            icon={<Icon name="shop" />}
                            title="Pazar"
                            subtitle="Canlı akış / piyasalar"
                            onClick={() => {
                              setOpenUser(false);
                              router.push("/pazar");
                            }}
                          />
                          <MenuItem
                            icon={<Icon name="settings" />}
                            title="Ayarlar"
                            subtitle="Bildirim • gizlilik • hesap"
                            onClick={() => {
                              setOpenUser(false);
                              router.push("/settings");
                            }}
                          />
                          <MenuItem
                            icon={<Icon name="bell" />}
                            title="Bildirim Ayarları"
                            subtitle="Mesaj / sistem / ilan aç-kapat"
                            onClick={() => {
                              setOpenUser(false);
                              router.push("/settings/notifications");
                            }}
                          />

                          {/* ✅ ADMIN PANEL (Sadece admin) */}
                          {isAdmin ? (
                            <>
                              <div className="my-1 h-px bg-black/10 dark:bg-white/10" />
                              <MenuItem
                                icon={<Icon name="shield" />}
                                title="Admin Panel"
                                subtitle="Kullanıcılar • KYC • Talepler"
                                onClick={() => {
                                  setOpenUser(false);
                                  router.push("/admin");
                                }}
                              />
                            </>
                          ) : null}
                        </div>

                        <div className="mt-3 h-px bg-black/10 dark:bg-white/10" />

                        <button
                          onClick={logout}
                          className="mt-3 w-full rounded-2xl bg-rose-500 px-4 py-3 text-sm font-black text-white hover:bg-rose-400 transition"
                        >
                          Çıkış Yap
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button
                    className="rounded-2xl border border-black/10 bg-white/60 px-4 py-2 text-sm font-extrabold text-black/80 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                    onClick={goLogin}
                  >
                    Giriş Yap
                  </button>
                  <a
                    className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-black hover:bg-emerald-400 transition"
                    href={anchorHref(onHome, "#fiyat")}
                  >
                    Premium Başla
                  </a>
                </>
              )}
            </div>

            {/* Mobile button */}
            <div className="flex items-center gap-2 md:hidden">
              <ThemeButton onClick={toggleTheme} theme={theme} className="px-3" />
              <button
                type="button"
                className="rounded-2xl border border-black/10 bg-white/60 px-3 py-2 text-black/80 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                onClick={() => setOpenMobile(true)}
                aria-label="Menü"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile sheet */}
      {openMobile && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm"
            onClick={() => setOpenMobile(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[90%] max-w-sm border-l border-black/10 bg-white/90 p-5 dark:border-white/10 dark:bg-black/85">
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-black/90 dark:text-white/90">Menü</div>
              <button
                className="rounded-2xl border border-black/10 bg-white/60 px-3 py-2 text-sm font-extrabold text-black/80 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                onClick={() => setOpenMobile(false)}
              >
                Kapat
              </button>
            </div>

            {/* User area */}
            <div className="mt-4 rounded-[26px] border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
              {me.loading ? (
                <div className="text-sm font-extrabold text-black/60 dark:text-white/60">Yükleniyor…</div>
              ) : me.authed ? (
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 overflow-hidden rounded-3xl ring-1 ring-black/10 bg-white/70 dark:ring-white/10 dark:bg-black/25">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={bust(avatarUrl)} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-black text-black/70 dark:text-white/75">
                        {initials(displayName)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black text-black/90 dark:text-white/90">{displayName}</div>
                    <div className="mt-0.5 text-xs text-black/55 dark:text-white/55">
                      {isPremium ? "Premium üye" : "Standart üye"} {isAdmin ? "• Admin" : ""}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-extrabold text-black/80 dark:text-white/80">Giriş gerekli</div>
                  <button
                    onClick={() => {
                      setOpenMobile(false);
                      goLogin();
                    }}
                    className="rounded-2xl bg-emerald-500 px-3 py-2 text-sm font-black text-black hover:bg-emerald-400 transition"
                  >
                    Giriş Yap
                  </button>
                </div>
              )}
            </div>

            {/* Nav */}
            <div className="mt-4 space-y-1">
              {nav.map((x) => (
                <a
                  key={x.href}
                  href={anchorHref(onHome, x.href)}
                  className="block rounded-2xl px-3 py-3 text-sm font-extrabold text-black/80 hover:bg-black/5 dark:text-white/80 dark:hover:bg-white/5"
                  onClick={() => setOpenMobile(false)}
                >
                  {x.label}
                </a>
              ))}
            </div>

            <div className="mt-2 space-y-1">
              <button
                className="block w-full rounded-2xl px-3 py-3 text-left text-sm font-extrabold text-black/80 hover:bg-black/5 dark:text-white/80 dark:hover:bg-white/5"
                onClick={() => {
                  setOpenMobile(false);
                  router.push("/pazar");
                }}
              >
                🏪 Pazar
              </button>

              <button
                className="block w-full rounded-2xl px-3 py-3 text-left text-sm font-extrabold text-black/80 hover:bg-black/5 dark:text-white/80 dark:hover:bg-white/5"
                onClick={() => {
                  setOpenMobile(false);
                  router.push("/favorites");
                }}
              >
                ❤️ Favoriler
              </button>

              <button
                className="block w-full rounded-2xl px-3 py-3 text-left text-sm font-extrabold text-black/80 hover:bg-black/5 dark:text-white/80 dark:hover:bg-white/5"
                onClick={() => {
                  setOpenMobile(false);
                  router.push("/conversations");
                }}
              >
                💬 Mesajlar <UnreadBadge n={unread} />
              </button>

              <button
                className="block w-full rounded-2xl px-3 py-3 text-left text-sm font-extrabold text-black/80 hover:bg-black/5 dark:text-white/80 dark:hover:bg-white/5"
                onClick={() => {
                  setOpenMobile(false);
                  router.push("/settings");
                }}
              >
                ⚙️ Ayarlar
              </button>

              <button
                className="block w-full rounded-2xl px-3 py-3 text-left text-sm font-extrabold text-black/80 hover:bg-black/5 dark:text-white/80 dark:hover:bg-white/5"
                onClick={() => {
                  setOpenMobile(false);
                  router.push("/settings/notifications");
                }}
              >
                🔔 Bildirim Ayarları
              </button>

              {/* ✅ ADMIN PANEL (Sadece admin) */}
              {me.authed && isAdmin ? (
                <button
                  className="block w-full rounded-2xl px-3 py-3 text-left text-sm font-extrabold text-rose-600 hover:bg-black/5 dark:hover:bg-white/5"
                  onClick={() => {
                    setOpenMobile(false);
                    router.push("/admin");
                  }}
                >
                  🛠 Admin Panel
                </button>
              ) : null}
            </div>

            <div className="mt-6 grid gap-2">
              {me.authed ? (
                <>
                  <button
                    className="rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm font-extrabold text-black/80 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                    onClick={() => (setOpenMobile(false), router.push("/profile"))}
                  >
                    Profil
                  </button>

                  <button
                    className="rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm font-extrabold text-black/80 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                    onClick={() => (setOpenMobile(false), router.push("/premium"))}
                  >
                    Premium
                  </button>

                  <button
                    className="w-full rounded-2xl bg-rose-500 px-4 py-3 text-sm font-black text-white hover:bg-rose-400 transition"
                    onClick={() => {
                      setOpenMobile(false);
                      logout();
                    }}
                  >
                    Çıkış Yap
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm font-extrabold text-black/80 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                    onClick={() => (setOpenMobile(false), goLogin())}
                  >
                    Giriş Yap
                  </button>
                  <a
                    className="rounded-2xl bg-emerald-500 px-4 py-3 text-center text-sm font-black text-black hover:bg-emerald-400 transition"
                    href={anchorHref(onHome, "#fiyat")}
                    onClick={() => setOpenMobile(false)}
                  >
                    Premium Başla
                  </a>
                </>
              )}
            </div>

            <div className="mt-6 text-xs text-black/55 dark:text-white/50">HalApp • Premium deneyim • Supabase altyapı</div>
          </div>
        </div>
      )}
    </>
  );
}