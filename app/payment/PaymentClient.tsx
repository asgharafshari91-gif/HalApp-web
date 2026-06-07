"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

type BankAccount = {
  id: string;
  bank_name: string | null;
  iban: string | null;
  account_holder: string | null;
  branch_name: string | null;
  account_no: string | null;
  note: string | null;
};

type ListingRow = {
  id: string;
  title: string | null;
  product_name: string | null;
  city: string | null;
  district: string | null;
  price: number | null;
  price_per_unit: number | null;
  unit: string | null;
  media_urls: string[] | null;
};

type ProductPackage = {
  code: "boost_24h" | "boost_3d" | "featured_7d";
  type: "listing_boost" | "listing_featured";
  title: string;
  price: number;
  desc: string;
  days: number;
  badge: string;
};

const PACKAGES: Record<string, ProductPackage> = {
  boost_24h: {
    code: "boost_24h",
    type: "listing_boost",
    title: "Boost 24 Saat",
    price: 499,
    desc: "İlan 24 saat boyunca üst sıralarda daha görünür olur.",
    days: 1,
    badge: "⭐ Hızlı Etki",
  },
  boost_3d: {
    code: "boost_3d",
    type: "listing_boost",
    title: "Boost 3 Gün",
    price: 999,
    desc: "İlan 3 gün boyunca daha fazla alıcıya gösterilir.",
    days: 3,
    badge: "🚀 Popüler",
  },
  featured_7d: {
    code: "featured_7d",
    type: "listing_featured",
    title: "Vitrin 7 Gün",
    price: 2999,
    desc: "İlan 7 gün boyunca vitrin ve öne çıkan alanlarda gösterilir.",
    days: 7,
    badge: "👑 En Güçlü",
  },
};

function fmt(n: number) {
  return Number(n || 0).toLocaleString("tr-TR");
}

function createOrderCode() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `PAY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  }

  return `PAY-${Date.now()}`;
}

export default function PaymentClient() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [listing, setListing] = useState<ListingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [selectedCode, setSelectedCode] = useState<string>("featured_7d");

  const params = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        productCode: "featured_7d",
        listingId: "",
        source: "web",
      };
    }

    const sp = new URLSearchParams(window.location.search);

    return {
      productCode: sp.get("product_code") || "featured_7d",
      listingId: sp.get("listing_id") || "",
      source: sp.get("source") || "web",
    };
  }, []);

  useEffect(() => {
    setSelectedCode(PACKAGES[params.productCode] ? params.productCode : "featured_7d");
  }, [params.productCode]);

  const selectedPackage = PACKAGES[selectedCode] ?? PACKAGES.featured_7d;
  const activeBank = bankAccounts[0] ?? null;

  async function loadAuth() {
    const { data } = await supabase.auth.getSession();
    setUser(data.session?.user ?? null);
    setAuthLoading(false);
  }

  async function loadBankAccounts() {
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("id, bank_name, iban, account_holder, branch_name, account_no, note")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!error) setBankAccounts((data ?? []) as BankAccount[]);
  }

  async function loadListing() {
    if (!params.listingId) return;

    const { data, error } = await supabase
      .from("listings")
      .select("id,title,product_name,city,district,price,price_per_unit,unit,media_urls")
      .eq("id", params.listingId)
      .maybeSingle();

    if (!error && data) setListing(data as ListingRow);
  }

  async function init() {
    setLoading(true);
    await Promise.all([loadAuth(), loadBankAccounts(), loadListing()]);
    setLoading(false);
  }

  useEffect(() => {
    init();
  }, []);

  async function uploadReceipt(orderId: string, orderCode: string) {
    if (!user || !receiptFile) return null;

    setUploadingReceipt(true);

    try {
      const ext = receiptFile.name.split(".").pop() || "jpg";
      const path = `payment_receipts/${user.id}/${orderCode}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("payment_receipts")
        .upload(path, receiptFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("payment_receipts").getPublicUrl(path);
      const receiptUrl = data.publicUrl;

      const { error: receiptError } = await supabase.from("payment_receipts").insert({
        payment_order_id: orderId,
        file_url: receiptUrl,
      });

      if (receiptError) {
        console.warn("payment_receipts insert error:", receiptError.message);
      }

      return receiptUrl;
    } finally {
      setUploadingReceipt(false);
    }
  }

  async function createPaymentOrder() {
    if (!user) {
      window.location.href = "/auth";
      return;
    }

    if (!params.listingId) {
      setMessage("İlan ID bulunamadı. Ödeme oluşturulamadı.");
      return;
    }

    if (!activeBank) {
      setMessage("Aktif banka hesabı bulunamadı.");
      return;
    }

    setCreating(true);
    setMessage("");

    try {
      const orderCode = createOrderCode();

      const { data: order, error } = await supabase
        .from("payment_orders")
        .insert({
          user_id: user.id,
          order_code: orderCode,
          product_code: selectedPackage.code,
          product_type: selectedPackage.type,
          product_title: selectedPackage.title,
          listing_id: params.listingId,
          amount: selectedPackage.price,
          currency: "TRY",
          payment_method: "bank_transfer",
          status: "reported",
          bank_account_id: activeBank.id,
          transfer_reference: orderCode,
          payer_note: `İlan öne çıkarma ödemesi. Paket: ${selectedPackage.title}`,
          reported_at: new Date().toISOString(),
          deleted_by_user: false,
          meta: {
            source: params.source,
            module: "listing_promotion",
            package_days: selectedPackage.days,
            receipt_expected: Boolean(receiptFile),
          },
        })
        .select("id")
        .single();

      if (error) throw error;

      if (receiptFile) {
        await uploadReceipt(order.id, orderCode);
      }

      setMessage(
        `✅ Ödeme bildirimin oluşturuldu. Açıklama kodu: ${orderCode}. Admin onayından sonra ilan otomatik öne çıkarılacak.`
      );
    } catch (e: any) {
      setMessage(e?.message ? `Ödeme bildirimi oluşturulamadı: ${e.message}` : "Ödeme bildirimi oluşturulamadı.");
    } finally {
      setCreating(false);
      setUploadingReceipt(false);
    }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-[#f6f8fb] p-8 text-center text-sm font-black text-zinc-500 dark:bg-[#050816] dark:text-white/50">
        Ödeme sayfası hazırlanıyor...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#f6f8fb] p-6 text-zinc-950 dark:bg-[#050816] dark:text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-[38px] border border-zinc-200 bg-white p-8 text-center dark:border-white/10 dark:bg-[#0b1021]">
            <div className="text-5xl">🔐</div>
            <h1 className="mt-5 text-3xl font-black">Giriş gerekli</h1>
            <p className="mt-2 text-sm font-semibold text-zinc-500 dark:text-white/50">
              Ödeme bildirimi oluşturmak için giriş yapmalısın.
            </p>
            <a
              href="/auth"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-500 px-8 text-sm font-black text-white"
            >
              Giriş Yap →
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] p-4 text-zinc-950 dark:bg-[#050816] dark:text-white sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[42px] border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1021]">
          <div className="border-b border-zinc-200 p-7 dark:border-white/10">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-300">
              HALAPP PREMIUM PAYMENT
            </div>

            <h1 className="mt-3 text-4xl font-black tracking-tight">
              İlan Öne Çıkarma Ödemesi
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/50">
              Paketi seç, banka havalesi/EFT yap, dekontu yükle ve ödeme bildirimi oluştur.
              Admin onayından sonra ilgili ilan otomatik öne çıkarılır.
            </p>
          </div>

          <div className="grid gap-6 p-7 xl:grid-cols-[1fr_460px]">
            <div className="grid gap-5">
              <div className="rounded-[32px] border border-zinc-200 bg-zinc-50 p-5 dark:border-white/10 dark:bg-white/[0.035]">
                <div className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-white/40">
                  Paket Seçimi
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {Object.values(PACKAGES).map((pkg) => (
                    <button
                      key={pkg.code}
                      type="button"
                      onClick={() => setSelectedCode(pkg.code)}
                      className={`rounded-[28px] border p-5 text-left transition ${
                        selectedCode === pkg.code
                          ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                          : "border-zinc-200 bg-white hover:border-emerald-300 dark:border-white/10 dark:bg-white/[0.04]"
                      }`}
                    >
                      <div className="text-xs font-black text-emerald-600">{pkg.badge}</div>
                      <div className="mt-3 text-xl font-black">{pkg.title}</div>
                      <div className="mt-2 text-sm font-semibold text-zinc-500 dark:text-white/50">
                        {pkg.desc}
                      </div>
                      <div className="mt-4 text-3xl font-black text-emerald-600">
                        ₺{fmt(pkg.price)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[32px] border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-white/40">
                  İlgili İlan
                </div>

                {listing ? (
                  <div className="mt-4 flex gap-4">
                    <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-zinc-100 dark:bg-white/[0.06]">
                      {listing.media_urls?.[0] ? (
                        <img src={listing.media_urls[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-4xl">🧺</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-2xl font-black">
                        {listing.product_name || listing.title || "İlan"}
                      </h3>

                      <div className="mt-2 text-sm font-semibold text-zinc-500 dark:text-white/50">
                        {listing.city || "Şehir yok"} {listing.district ? `/ ${listing.district}` : ""}
                      </div>

                      <div className="mt-3 text-lg font-black text-emerald-700 dark:text-emerald-300">
                        ₺{fmt(Number(listing.price_per_unit || listing.price || 0))}
                        {listing.unit ? ` / ${listing.unit}` : ""}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl bg-orange-500/10 p-4 text-sm font-bold text-orange-700 dark:text-orange-300">
                    İlan bilgisi bulunamadı. Listing ID varsa ödeme yine oluşturulabilir.
                  </div>
                )}
              </div>

              <div className="rounded-[32px] border border-emerald-500/20 bg-emerald-500/10 p-6">
                <div className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  Seçilen Paket Özeti
                </div>

                <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-3xl font-black">{selectedPackage.title}</h2>
                    <p className="mt-2 text-sm font-semibold text-zinc-600 dark:text-white/55">
                      {selectedPackage.desc}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white/70 px-5 py-4 text-right dark:bg-white/[0.06]">
                    <div className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                      Tutar
                    </div>
                    <div className="mt-1 text-4xl font-black">₺{fmt(selectedPackage.price)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[34px] border border-emerald-500/20 bg-emerald-500/10 p-6">
              <div className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Banka Havalesi / EFT
              </div>

              <div className="mt-3 text-4xl font-black">₺{fmt(selectedPackage.price)}</div>

              <div className="mt-5 space-y-3">
                {bankAccounts.length ? (
                  bankAccounts.map((bank) => (
                    <div
                      key={bank.id}
                      className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.06]"
                    >
                      <div className="text-sm font-black">{bank.bank_name || "Banka"}</div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/45">
                        {bank.account_holder || "Hesap Sahibi"}
                      </div>

                      <div className="mt-3 rounded-xl bg-zinc-50 p-3 font-mono text-xs font-black text-zinc-700 dark:bg-black/20 dark:text-white">
                        {bank.iban || "IBAN yok"}
                      </div>

                      {bank.branch_name || bank.account_no || bank.note ? (
                        <div className="mt-3 grid gap-1 text-xs font-semibold text-zinc-500 dark:text-white/45">
                          {bank.branch_name ? <div>Şube: {bank.branch_name}</div> : null}
                          {bank.account_no ? <div>Hesap No: {bank.account_no}</div> : null}
                          {bank.note ? <div>Not: {bank.note}</div> : null}
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 text-sm font-bold text-orange-700 dark:text-orange-300">
                    Aktif banka hesabı bulunamadı.
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-2xl bg-white/70 p-4 dark:bg-white/[0.06]">
                <div className="text-xs font-black uppercase tracking-wide text-zinc-400 dark:text-white/35">
                  Ödeme Açıklaması
                </div>

                <div className="mt-2 text-sm font-bold text-zinc-600 dark:text-white/55">
                  Ödeme bildirimi oluşturduğunda sistem otomatik sipariş kodu verir.
                  Havale açıklamasına o kodu yazman önerilir.
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.06]">
                <div className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-white/40">
                  Dekont Yükle
                </div>

                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="mt-3 w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs font-bold dark:border-white/10 dark:bg-black/20"
                />

                {receiptFile ? (
                  <div className="mt-3 rounded-xl bg-emerald-500/10 p-3 text-xs font-black text-emerald-700 dark:text-emerald-300">
                    ✅ {receiptFile.name}
                  </div>
                ) : (
                  <div className="mt-3 text-xs font-semibold text-zinc-500 dark:text-white/45">
                    Dekont yüklemek admin onayını hızlandırır.
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={creating || uploadingReceipt}
                onClick={createPaymentOrder}
                className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-500 text-sm font-black text-white transition hover:bg-emerald-600 disabled:opacity-60"
              >
                {creating || uploadingReceipt ? "Bildirim oluşturuluyor..." : "Ödeme Yaptım / Bildir"}
              </button>

              {message ? (
                <div className="mt-4 rounded-2xl bg-white/70 p-4 text-xs font-black text-emerald-700 dark:bg-white/[0.06] dark:text-emerald-300">
                  {message}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}