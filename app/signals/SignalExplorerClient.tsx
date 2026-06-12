"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import MarketRadar from "@/components/signal/MarketRadar";
import Sidebar from "@/components/signal/Sidebar";
import Header from "@/components/signal/Header";
import StatsGrid from "@/components/signal/StatsGrid";
import TurkeyMarketMap from "@/components/signal/TurkeyMarketMap";
import MarketPulseCards from "@/components/signal/MarketPulseCards";
import LiveFeed from "@/components/signal/LiveFeed";
import MarketTrends from "@/components/signal/MarketTrends";
import SignalTable from "@/components/signal/SignalTable";
import SignalModal from "@/components/signal/SignalModal";
import TopCities from "@/components/signal/TopCities";
import IntelligenceCenter from "@/components/signal/IntelligenceCenter";
import type { SignalRow } from "@/types/signal";
import { supabase } from "@/lib/supabaseClient";

type TopProduct = { productName: string; signals: number };

type PaymentOrder = {
  id: string;
  order_code: string | null;
  product_code: string | null;
  product_type: string | null;
  status: string | null;
  amount: number | null;
  currency: string | null;
  created_at: string | null;
  reported_at: string | null;
};

type TradeRoute = {
  productName: string;
  listingCity: string;
  listingDistrict: string;
  buyerCity: string;
  buyerDistrict: string;
  signals: number;
  gpsSignals: number;
  ipSignals: number;
  mobileSignals: number;
  desktopSignals: number;
  uniqueVisitors: number;
  lastAt: string;
};

type BankAccount = {
  id: string;
  bank_name: string | null;
  account_holder: string | null;
  iban: string | null;
  branch_name?: string | null;
  account_no?: string | null;
  note?: string | null;
  is_active?: boolean | null;
};

type ExplorerData = {
  totalSignals: number;
  signals24h: number;
  activeCities: number;
  gpsSignals: number;
  topProducts: TopProduct[];
  tradeRoutes: TradeRoute[];
  signals: SignalRow[];
};

type ProfileAccess = {
  created_at: string | null;
  kyc_status: string | null;
  verified: boolean | null;
  is_admin: boolean | null;
  is_premium: boolean | null;
  premium_until: string | null;
  premium_expires_at: string | null;
  membership_status: string | null;
  membership_expires_at: string | null;
};

type FilterType = "all" | "gps" | "ip";

type CityStat = {
  city: string;
  signals: number;
  gps: number;
  ip: number;
  mobile: number;
  desktop: number;
  lastAt: string;
};

type PulseCard = { city: string; product: string; signals: number };

const TRIAL_DAYS = 7;
const MONTHLY_PRICE = 7899;

const emptyData: ExplorerData = {
  totalSignals: 0,
  signals24h: 0,
  activeCities: 0,
  gpsSignals: 0,
  topProducts: [],
  tradeRoutes: [],
  signals: [],
};

function normalize(value: unknown) {
  return String(value ?? "")
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .trim();
}

function fmt(n: number) {
  return Number(n || 0).toLocaleString("tr-TR");
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysLeft(expireAt: Date) {
  const diff = expireAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function isFuture(value?: string | null) {
  if (!value) return false;
  const t = new Date(value).getTime();
  return !Number.isNaN(t) && t > Date.now();
}

function isKycApproved(profile: ProfileAccess | null) {
  return profile?.kyc_status === "approved" || profile?.verified === true;
}

function hasProfilePremium(profile: ProfileAccess | null) {
  return (
    profile?.is_premium === true ||
    profile?.membership_status === "active" ||
    isFuture(profile?.premium_until) ||
    isFuture(profile?.premium_expires_at) ||
    isFuture(profile?.membership_expires_at)
  );
}

function toSignalRow(x: any): SignalRow {
  return {
    id: String(x?.id ?? ""),
    city: x?.city ?? null,
    district: x?.district ?? null,
    country: x?.country ?? null,
    source: x?.source ?? null,
    platform: x?.platform ?? null,
    deviceType: x?.deviceType ?? null,
    locationSource: x?.locationSource ?? null,
    createdAt: x?.createdAt ?? null,
    listingId: x?.listingId ?? null,
    listingTitle: x?.listingTitle ?? "İlan",
    productName: x?.productName ?? null,
    postType: x?.postType ?? null,
  };
}

function toTradeRoute(x: any): TradeRoute {
  return {
    productName: String(x?.productName ?? "İlan"),
    listingCity: String(x?.listingCity ?? ""),
    listingDistrict: String(x?.listingDistrict ?? ""),
    buyerCity: String(x?.buyerCity ?? ""),
    buyerDistrict: String(x?.buyerDistrict ?? ""),
    signals: Number(x?.signals ?? 0),
    gpsSignals: Number(x?.gpsSignals ?? 0),
    ipSignals: Number(x?.ipSignals ?? 0),
    mobileSignals: Number(x?.mobileSignals ?? 0),
    desktopSignals: Number(x?.desktopSignals ?? 0),
    uniqueVisitors: Number(x?.uniqueVisitors ?? 0),
    lastAt: String(x?.lastAt ?? ""),
  };
}

function getCityStats(signals: SignalRow[]): CityStat[] {
  const map = new Map<string, CityStat>();

  for (const s of signals) {
    const city = s.city || "Bilinmeyen";
    const key = normalize(city);

    const prev =
      map.get(key) ??
      ({
        city,
        signals: 0,
        gps: 0,
        ip: 0,
        mobile: 0,
        desktop: 0,
        lastAt: s.createdAt || "",
      } satisfies CityStat);

    prev.signals += 1;
    if (normalize(s.locationSource) === "gps") prev.gps += 1;
    else prev.ip += 1;

    const device = normalize(s.deviceType);
    if (device.includes("mobile")) prev.mobile += 1;
    if (device.includes("desktop")) prev.desktop += 1;

    if (
      s.createdAt &&
      (!prev.lastAt ||
        new Date(s.createdAt).getTime() > new Date(prev.lastAt).getTime())
    ) {
      prev.lastAt = s.createdAt;
    }

    map.set(key, prev);
  }

  return Array.from(map.values()).sort((a, b) => b.signals - a.signals);
}

function getPulseCards(signals: SignalRow[]): PulseCard[] {
  const map = new Map<string, PulseCard>();

  for (const s of signals) {
    const city = s.city || "Türkiye";
    const product = s.productName || s.listingTitle || "İlan";
    const key = `${normalize(city)}-${normalize(product)}`;
    const prev = map.get(key) ?? { city, product, signals: 0 };
    prev.signals += 1;
    map.set(key, prev);
  }

  return Array.from(map.values()).sort((a, b) => b.signals - a.signals).slice(0, 4);
}

function LoginGate() {
  return (
    <main className="min-h-screen bg-[#f6f8fb] p-4 text-zinc-950 dark:bg-[#050816] dark:text-white sm:p-6">
      <div className="mx-auto flex min-h-[80vh] max-w-4xl items-center justify-center">
        <div className="w-full rounded-[40px] border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#0b1021]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-emerald-500 text-4xl text-white">
            🌿
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight">
            HalApp Market Intelligence
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/50">
            Bu sayfaya erişmek için giriş yapmalısın.
          </p>
          <a
            href="/auth?next=/signals"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-500 px-8 text-sm font-black text-white hover:bg-emerald-600"
          >
            Giriş Yap →
          </a>
        </div>
      </div>
    </main>
  );
}

function KycGate() {
  return (
    <main className="min-h-screen bg-[#f6f8fb] p-4 text-zinc-950 dark:bg-[#050816] dark:text-white sm:p-6">
      <div className="mx-auto flex min-h-[80vh] max-w-4xl items-center justify-center">
        <div className="w-full rounded-[40px] border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#0b1021]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-yellow-500 text-4xl text-white">
            🛡️
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight">
            KYC Onayı Gerekli
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/50">
            Market Intelligence verilerini görebilmek için hesabınızı doğrulamanız
            gerekir. KYC onaylandıktan sonra 7 günlük ücretsiz deneme süreniz aktif olur.
          </p>
          <a
            href="/profile?kyc=required&next=/signals"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-500 px-8 text-sm font-black text-white hover:bg-emerald-600"
          >
            KYC Başvurusu Yap →
          </a>
        </div>
      </div>
    </main>
  );
}
function PaywallGate({
  user,
  bankAccounts,
  pendingPayment,
  onPaymentNotify,
  paymentLoading,
  paymentMessage,
}: {
  user: User;
  bankAccounts: BankAccount[];
  pendingPayment: PaymentOrder | null;
  onPaymentNotify: () => void;
  paymentLoading: boolean;
  paymentMessage: string;
}) {
  const paymentCode = `MARKET-${user.id.slice(0, 8)}`;

  return (
    <main className="min-h-screen bg-[#f6f8fb] p-4 text-zinc-950 dark:bg-[#050816] dark:text-white sm:p-6">
      <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[42px] border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1021]">
          <div className="border-b border-zinc-200 p-8 dark:border-white/10">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.22em] text-orange-600 dark:text-orange-300">
                  Ücretsiz Deneme Sona Erdi
                </div>

                <h1 className="mt-3 text-4xl font-black tracking-tight">
                  Market Intelligence Aylık Üyelik
                </h1>

                <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/50">
                  7 günlük ücretsiz deneme süreniz bitti. Canlı ticaret rotaları,
                  talep analizleri, ürün trendleri, PDF raporlar ve AI destekli
                  yorumlara erişmeye devam etmek için aylık üyelik gerekir.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4">
                <div className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  Aylık Paket
                </div>

                <div className="mt-1 text-3xl font-black text-zinc-950 dark:text-white">
                  ₺{fmt(MONTHLY_PRICE)}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-8 xl:grid-cols-[1fr_440px]">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["🚚", "Ticaret Rotaları", "Alıcı şehir → ilan şehri ürün akışı"],
                ["🚨", "Akıllı Uyarılar", "Talep patlaması ve sıcak rota alarmı"],
                ["📊", "PDF Rapor", "HalApp logolu indirilebilir raporlar"],
                ["🧠", "AI Tavsiye", "Tüccar için aksiyon odaklı yorumlar"],
              ].map(([icon, title, desc]) => (
                <div
                  key={title}
                  className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-5 dark:border-white/10 dark:bg-white/[0.035]"
                >
                  <div className="text-4xl">{icon}</div>

                  <div className="mt-4 text-lg font-black text-zinc-950 dark:text-white">
                    {title}
                  </div>

                  <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/50">
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-[32px] border border-emerald-500/20 bg-emerald-500/10 p-6">
              <div className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Ödeme Sayfası
              </div>

              <div className="mt-3 text-5xl font-black text-zinc-950 dark:text-white">
                ₺{fmt(MONTHLY_PRICE)}
              </div>

              <div className="mt-2 text-sm font-semibold text-zinc-500 dark:text-white/55">
                Aylık Market Intelligence üyeliği
              </div>

              <div className="mt-5 rounded-2xl bg-white/70 p-4 dark:bg-white/[0.06]">
                <div className="text-xs font-black uppercase tracking-wide text-zinc-400 dark:text-white/35">
                  Havale / EFT Açıklaması
                </div>

                <div className="mt-2 rounded-xl bg-zinc-950 px-4 py-3 font-mono text-sm font-black text-white dark:bg-white dark:text-zinc-950">
                  {paymentCode}
                </div>

                <div className="mt-2 text-xs font-semibold leading-relaxed text-zinc-500 dark:text-white/45">
                  Dekont açıklamasına bu kodu yaz. Admin bu kodla ödemeyi
                  eşleştirir.
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {bankAccounts.length ? (
                  bankAccounts.map((bank) => (
                    <div
                      key={bank.id}
                      className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.06]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-zinc-950 dark:text-white">
                            {bank.bank_name || "Banka"}
                          </div>

                          <div className="mt-1 text-xs font-semibold leading-relaxed text-zinc-500 dark:text-white/45">
                            {bank.account_holder || "Hesap Sahibi"}
                          </div>
                        </div>

                        <div className="shrink-0 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">
                          TRY
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl bg-zinc-50 p-3 font-mono text-xs font-black text-zinc-700 dark:bg-black/20 dark:text-white">
                        {bank.iban || "IBAN bilgisi yok"}
                      </div>

                      {bank.branch_name || bank.account_no || bank.note ? (
                        <div className="mt-3 grid gap-2 text-xs font-semibold text-zinc-500 dark:text-white/45">
                          {bank.branch_name ? (
                            <div>Şube: {bank.branch_name}</div>
                          ) : null}

                          {bank.account_no ? (
                            <div>Hesap No: {bank.account_no}</div>
                          ) : null}

                          {bank.note ? <div>Not: {bank.note}</div> : null}
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 text-sm font-bold text-orange-700 dark:text-orange-300">
                    Aktif banka hesabı bulunamadı. Supabase `bank_accounts`
                    tablosuna aktif IBAN ekle.
                  </div>
                )}
              </div>

              {pendingPayment ? (
                <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                  <div className="text-xs font-black uppercase tracking-wide text-yellow-700 dark:text-yellow-300">
                    Ödeme Bekleniyor
                  </div>

                  <div className="mt-2 text-sm font-black text-zinc-950 dark:text-white">
                    Bildirim alındı, admin onayı bekleniyor.
                  </div>

                  <div className="mt-2 text-xs font-semibold text-zinc-500 dark:text-white/50">
                    Sipariş kodu: {pendingPayment.order_code || "Beklemede"}
                  </div>

                  <div className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/50">
                    Durum: {pendingPayment.status || "pending"}
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                disabled={paymentLoading || Boolean(pendingPayment)}
                onClick={onPaymentNotify}
                className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-500 text-sm font-black text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendingPayment
                  ? "Ödeme Bildirimi Beklemede"
                  : paymentLoading
                    ? "Bildirim oluşturuluyor..."
                    : "Ödeme Yaptım / Bildir"}
              </button>

              {paymentMessage ? (
                <div className="mt-4 rounded-2xl bg-white/70 p-3 text-xs font-black text-emerald-700 dark:bg-white/[0.06] dark:text-emerald-300">
                  {paymentMessage}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SignalExplorerClient() {
  const [data, setData] = useState<ExplorerData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(true);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileAccess | null>(null);
  const [kycApproved, setKycApproved] = useState(false);
  const [hasPaidAccess, setHasPaidAccess] = useState(false);

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [lastRefresh, setLastRefresh] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selected, setSelected] = useState<SignalRow | null>(null);

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [pendingPayment, setPendingPayment] = useState<PaymentOrder | null>(null);

  async function loadBankAccounts() {
    const { data, error } = await supabase
      .from("bank_accounts")
      .select(
        "id, bank_name, account_holder, iban, branch_name, account_no, note, is_active"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("bank_accounts error:", error.message);
      return;
    }

    setBankAccounts((data ?? []) as BankAccount[]);
  }

  async function checkAccess(currentUser: User | null) {
    if (!currentUser) {
      setAccessLoading(false);
      setProfile(null);
      setKycApproved(false);
      setHasPaidAccess(false);
      setPendingPayment(null);
      return;
    }

    setAccessLoading(true);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select(
        "created_at, kyc_status, verified, is_admin, is_premium, premium_until, premium_expires_at, membership_status, membership_expires_at"
      )
      .eq("id", currentUser.id)
      .maybeSingle();

    if (profileError) {
      console.log("profile access error:", profileError.message);
    }

    const accessProfile = (profileData ?? null) as ProfileAccess | null;
    const approvedKyc = isKycApproved(accessProfile);
    const premiumFromProfile = hasProfilePremium(accessProfile);

    setProfile(accessProfile);
    setKycApproved(approvedKyc);

    const { data: approvedOrders } = await supabase
      .from("payment_orders")
      .select("id,status,product_code,product_type,access_expires_at")
      .eq("user_id", currentUser.id)
      .eq("status", "approved")
      .gt("access_expires_at", new Date().toISOString())
      .or(
        "product_code.eq.market_intelligence,product_code.eq.market_intelligence_monthly,product_type.eq.market_intelligence,product_type.eq.subscription"
      )
      .limit(1);

    const { data: pendingOrders } = await supabase
      .from("payment_orders")
      .select(
        "id,order_code,product_code,product_type,status,amount,currency,created_at,reported_at"
      )
      .eq("user_id", currentUser.id)
      .eq("status", "pending")
      .or(
        "product_code.eq.market_intelligence,product_code.eq.market_intelligence_monthly,product_type.eq.market_intelligence,product_type.eq.subscription"
      )
      .order("created_at", { ascending: false })
      .limit(1);

    setHasPaidAccess(
      Boolean(premiumFromProfile || (approvedOrders && approvedOrders.length > 0))
    );

    setPendingPayment((pendingOrders?.[0] as PaymentOrder) ?? null);
    setAccessLoading(false);
  }

  async function createPaymentNotification() {
    if (!user) return;

    setPaymentLoading(true);
    setPaymentMessage("");

    const activeBank = bankAccounts[0] ?? null;
    const paymentCode = `MARKET-${user.id.slice(0, 8)}`;

    const orderCode =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `MARKET-${crypto.randomUUID().slice(0, 8)}`
        : `MARKET-${Date.now()}`;

    const { error } = await supabase.from("payment_orders").insert({
      user_id: user.id,
      order_code: orderCode,
      product_code: "market_intelligence",
      product_type: "subscription",
      product_title: "HalApp Market Intelligence Aylık Üyelik",
      amount: MONTHLY_PRICE,
      currency: "TRY",
      payment_method: "bank_transfer",
      status: "pending",
      bank_account_id: activeBank?.id ?? null,
      payer_note: paymentCode,
      transfer_reference: paymentCode,
      reported_at: new Date().toISOString(),
      deleted_by_user: false,
      meta: {
        source: "web",
        module: "market_intelligence",
        plan: "monthly",
        price: MONTHLY_PRICE,
      },
    });

    if (error) {
      console.log("PAYMENT ORDER ERROR:", error);
      setPaymentMessage(`Bildirim oluşturulamadı: ${error.message}`);
      setPaymentLoading(false);
      return;
    }

    setPaymentMessage(
      "Ödeme bildirimi oluşturuldu. Admin onayından sonra Market Intelligence erişimin açılacak."
    );

    await checkAccess(user);
    setPaymentLoading(false);
}
async function loadSignals() {
    const { data: rpcData, error } = await supabase.rpc("get_signal_explorer");

    if (error) {
      console.log("get_signal_explorer error:", error.message);
      setLoading(false);
      return;
    }

    const raw: any = rpcData ?? {};

    const signals: SignalRow[] = Array.isArray(raw.signals)
      ? raw.signals.map((x: any) => toSignalRow(x))
      : [];

    const topProducts: TopProduct[] = Array.isArray(raw.topProducts)
      ? raw.topProducts.map((x: any) => ({
          productName: String(x?.productName ?? "İlan"),
          signals: Number(x?.signals ?? 0),
        }))
      : [];

    const tradeRoutes: TradeRoute[] = Array.isArray(raw.tradeRoutes)
      ? raw.tradeRoutes.map((x: any) => toTradeRoute(x))
      : [];

    setData({
      totalSignals: Number(raw.totalSignals ?? 0),
      signals24h: Number(raw.signals24h ?? 0),
      activeCities: Number(raw.activeCities ?? 0),
      gpsSignals: Number(raw.gpsSignals ?? 0),
      topProducts,
      tradeRoutes,
      signals,
    });

    setLastRefresh(
      new Date().toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );

    setLoading(false);
  }

  useEffect(() => {
    async function initAuth() {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user ?? null;

      setUser(currentUser);
      setAuthLoading(false);
      await checkAccess(currentUser);
    }

    initAuth();
    loadBankAccounts();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        await checkAccess(currentUser);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const trialStartAt = profile?.created_at
    ? new Date(profile.created_at)
    : user?.created_at
      ? new Date(user.created_at)
      : null;

  const trialExpireAt = trialStartAt ? addDays(trialStartAt, TRIAL_DAYS) : null;
  const trialActive = trialExpireAt ? Date.now() <= trialExpireAt.getTime() : false;

  const isAdmin = profile?.is_admin === true;

  const allowed = Boolean(
    user && (isAdmin || (kycApproved && (trialActive || hasPaidAccess)))
  );

  useEffect(() => {
    if (!user || !allowed) return;

    loadSignals();

    const timer = window.setInterval(loadSignals, 15000);

    const ch = supabase
      .channel("signal-dashboard-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listing_view_logs" },
        () => loadSignals()
      )
      .subscribe();

    return () => {
      window.clearInterval(timer);
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, allowed]);

  const cityStats = useMemo(() => getCityStats(data.signals), [data.signals]);
  const pulseCards = useMemo(() => getPulseCards(data.signals), [data.signals]);

  const activeNow = useMemo(() => {
    const now = Date.now();

    return data.signals.filter((s) => {
      if (!s.createdAt) return false;
      const t = new Date(s.createdAt).getTime();
      if (Number.isNaN(t)) return false;
      return now - t <= 60 * 1000;
    }).length;
  }, [data.signals]);

  const filteredSignals = useMemo(() => {
    const q = normalize(query);

    return data.signals.filter((s) => {
      const haystack = normalize(
        [
          s.city,
          s.district,
          s.country,
          s.platform,
          s.deviceType,
          s.locationSource,
          s.listingTitle,
          s.productName,
          s.listingId,
          s.postType,
        ].join(" ")
      );

      const matchesQuery = !q || haystack.includes(q);
      const loc = normalize(s.locationSource);

      const matchesFilter =
        filter === "all" ||
        (filter === "gps" && loc === "gps") ||
        (filter === "ip" && loc !== "gps");

      return matchesQuery && matchesFilter;
    });
  }, [data.signals, query, filter]);

  const lastSignal: SignalRow | null = data.signals[0] ?? null;

  const gpsRate =
    data.totalSignals > 0
      ? Math.round((data.gpsSignals / data.totalSignals) * 100)
      : 0;

  if (authLoading || accessLoading) {
    return (
      <main className="min-h-screen bg-[#f6f8fb] p-10 text-center text-sm font-black text-zinc-500 dark:bg-[#050816] dark:text-white/50">
        Market Intelligence hazırlanıyor...
      </main>
    );
  }

  if (!user) return <LoginGate />;

  if (!isAdmin && !kycApproved) return <KycGate />;

  if (!allowed) {
    return (
      <PaywallGate
        user={user}
        bankAccounts={bankAccounts}
        pendingPayment={pendingPayment}
        onPaymentNotify={createPaymentNotification}
        paymentLoading={paymentLoading}
        paymentMessage={paymentMessage}
      />
    );
  }

  return (
    <main className="min-h-screen scroll-smooth bg-[#f6f8fb] text-zinc-950 dark:bg-[#050816] dark:text-white">
      <div className="mx-auto max-w-[1760px] p-4 sm:p-6">
        <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
          <div className="hidden xl:block">
            <Sidebar activeNow={activeNow} />
          </div>

          <section className="min-w-0">
            <div id="overview" className="scroll-mt-6">
              <Header
                lastRefresh={lastRefresh}
                totalSignals={data.totalSignals}
                activeCities={data.activeCities}
                gpsRate={gpsRate}
                onRefresh={loadSignals}
              />

              {!isAdmin && trialActive && !hasPaidAccess ? (
                <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4">
                  <div className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                    🎁 Market Intelligence 7 Gün Ücretsiz Deneme Aktif
                  </div>

                  <div className="mt-1 text-xs font-semibold leading-relaxed text-zinc-600 dark:text-white/60">
                    KYC onaylı hesabınızla Market Intelligence modülünü ücretsiz
                    kullanıyorsunuz. Kalan süre:{" "}
                    <span className="font-black text-emerald-700 dark:text-emerald-300">
                      {trialExpireAt ? daysLeft(trialExpireAt) : 0} gün
                    </span>
                    . Süre bitince devam etmek için aylık ₺{fmt(MONTHLY_PRICE)}
                    paket almanız gerekir.
                  </div>
                </div>
              ) : null}

              {!isAdmin && hasPaidAccess ? (
                <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-5 py-4">
                  <div className="text-sm font-black text-blue-700 dark:text-blue-300">
                    ✅ Market Intelligence Üyeliğiniz Aktif
                  </div>

                  <div className="mt-1 text-xs font-semibold leading-relaxed text-zinc-600 dark:text-white/60">
                    Canlı ticaret rotaları, şehir bazlı talep sinyalleri ve AI
                    destekli pazar analizlerine erişiminiz açık.
                  </div>
                </div>
              ) : null}

              <StatsGrid
                totalSignals={data.totalSignals}
                signals24h={data.signals24h}
                activeCities={data.activeCities}
                gpsSignals={data.gpsSignals}
              />
            </div>

            {loading ? (
              <div className="mt-6 rounded-[34px] border border-zinc-200 bg-white p-10 text-center text-sm font-black text-zinc-500 shadow-sm dark:border-white/10 dark:bg-[#0b1021] dark:text-white/50">
                Signal dashboard yükleniyor...
              </div>
            ) : (
              <>
                <div
                  id="turkey-map"
                  className="mt-6 grid scroll-mt-6 gap-6 2xl:grid-cols-[1.15fr_.85fr]"
                >
                  <TurkeyMarketMap cities={cityStats} />

                  <div className="grid gap-6">
                    <div id="merchant-radar" className="scroll-mt-6">
                      <MarketRadar
                        cities={cityStats}
                        lastSignal={lastSignal}
                        onSelectSignal={setSelected}
                      />
                    </div>

                    <div id="trade-routes" className="scroll-mt-6">
                      <TopCities
                        cities={cityStats}
                        tradeRoutes={data.tradeRoutes}
                      />
                    </div>
                  </div>
                </div>

                <div id="market-pulse" className="mt-6 scroll-mt-6">
                  <MarketPulseCards
                    data={pulseCards}
                    tradeRoutes={data.tradeRoutes}
                    topProducts={data.topProducts}
                    signals={data.signals}
                  />
                </div>

                <div id="market-trends" className="mt-6 scroll-mt-6">
                  <MarketTrends
                    products={data.topProducts}
                    cities={cityStats}
                    tradeRoutes={data.tradeRoutes}
                  />
                </div>

                <div className="mt-6">
                  <IntelligenceCenter
                    signals={data.signals}
                    tradeRoutes={data.tradeRoutes}
                    topProducts={data.topProducts}
                    cities={cityStats}
                  />
                </div>

                <div
                  id="live-feed"
                  className="mt-6 grid scroll-mt-6 gap-6 2xl:grid-cols-[1fr_420px]"
                >
                  <div id="signal-table" className="scroll-mt-6">
                    <SignalTable
                      signals={filteredSignals}
                      query={query}
                      setQuery={setQuery}
                      filter={filter}
                      setFilter={setFilter}
                      onSelect={(signal: SignalRow) => setSelected(signal)}
                    />
                  </div>

                  <LiveFeed
                    signals={data.signals}
                    onSelect={(signal: SignalRow) => setSelected(signal)}
                  />
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      <SignalModal signal={selected} onClose={() => setSelected(null)} />
    </main>
  );
}