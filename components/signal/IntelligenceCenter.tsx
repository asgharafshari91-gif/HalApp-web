"use client";

import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import type { SignalRow } from "@/types/signal";

const HALAPP_LOGO = "/halapp-logo.png";

type CityStat = {
  city: string;
  signals: number;
  gps: number;
  ip: number;
  mobile: number;
  desktop: number;
  lastAt: string;
};

type TopProduct = {
  productName: string;
  signals: number;
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

type Props = {
  signals: SignalRow[];
  tradeRoutes: TradeRoute[];
  topProducts: TopProduct[];
  cities: CityStat[];
};

type IntelligenceAlert = {
  icon: string;
  title: string;
  subtitle: string;
  desc: string;
  score: number;
  tone: "hot" | "warn" | "good" | "info";
};

function fmt(n: number) {
  return Number(n || 0).toLocaleString("tr-TR");
}

function trPdf(value: unknown) {
  return String(value ?? "")
    .replaceAll("İ", "I")
    .replaceAll("İ", "I")
    .replaceAll("ı", "i")
    .replaceAll("Ğ", "G")
    .replaceAll("ğ", "g")
    .replaceAll("Ü", "U")
    .replaceAll("ü", "u")
    .replaceAll("Ş", "S")
    .replaceAll("ş", "s")
    .replaceAll("Ö", "O")
    .replaceAll("ö", "o")
    .replaceAll("Ç", "C")
    .replaceAll("ç", "c")
    .replaceAll("₺", "TL")
    .replaceAll("→", "->")
    .replaceAll("•", "-");
}

function normalize(value?: string | null) {
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

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function score(value: number, max: number) {
  if (!max) return 0;
  return Math.max(8, Math.min(100, Math.round((value / max) * 100)));
}

function safeText(value: unknown, max = 24) {
  const s = trPdf(value);
  return s.length > max ? `${s.slice(0, max)}...` : s;
}

function productEmoji(name?: string | null) {
  const s = normalize(name);

  if (s.includes("elma")) return "🍎";
  if (s.includes("armut")) return "🍐";
  if (s.includes("portakal")) return "🍊";
  if (s.includes("mandalina")) return "🍊";
  if (s.includes("greyfurt")) return "🍊";
  if (s.includes("limon")) return "🍋";
  if (s.includes("muz")) return "🍌";
  if (s.includes("karpuz")) return "🍉";
  if (s.includes("kavun")) return "🍈";
  if (s.includes("üzüm")) return "🍇";
  if (s.includes("çilek")) return "🍓";
  if (s.includes("ahududu")) return "🫐";
  if (s.includes("böğürtlen")) return "🫐";
  if (s.includes("blueberry")) return "🫐";
  if (s.includes("yaban mersini")) return "🫐";
  if (s.includes("kiraz")) return "🍒";
  if (s.includes("vişne")) return "🍒";
  if (s.includes("şeftali")) return "🍑";
  if (s.includes("kayısı")) return "🍑";
  if (s.includes("nektarin")) return "🍑";
  if (s.includes("erik")) return "🟣";
  if (s.includes("nar")) return "🔴";
  if (s.includes("incir")) return "🟣";
  if (s.includes("kivi")) return "🥝";
  if (s.includes("ananas")) return "🍍";
  if (s.includes("mango")) return "🥭";
  if (s.includes("avokado")) return "🥑";

  if (s.includes("domates")) return "🍅";
  if (s.includes("biber")) return "🌶️";
  if (s.includes("patlıcan")) return "🍆";
  if (s.includes("salatalık")) return "🥒";
  if (s.includes("kabak")) return "🎃";
  if (s.includes("patates")) return "🥔";
  if (s.includes("soğan")) return "🧅";
  if (s.includes("sarımsak")) return "🧄";
  if (s.includes("havuç")) return "🥕";
  if (s.includes("brokoli")) return "🥦";
  if (s.includes("lahana")) return "🥬";
  if (s.includes("marul")) return "🥬";
  if (s.includes("ıspanak")) return "🥬";
  if (s.includes("mısır")) return "🌽";
  if (s.includes("mantar")) return "🍄";
  if (s.includes("kuşkonmaz")) return "🌱";

  if (s.includes("roka")) return "🌿";
  if (s.includes("nane")) return "🌿";
  if (s.includes("maydanoz")) return "🌿";
  if (s.includes("dereotu")) return "🌿";

  if (s.includes("ceviz")) return "🥜";
  if (s.includes("badem")) return "🥜";
  if (s.includes("fındık")) return "🥜";

  return "🧺";
}

function cityIcon(city?: string | null) {
  const c = normalize(city);
  const icons: Record<string, string> = {
    antalya: "🔥",
    istanbul: "🚀",
    izmir: "⚡",
    mersin: "🍋",
    adana: "🌶️",
    ankara: "🏛️",
    bursa: "📈",
    aydin: "🌿",
    isparta: "🌹",
    malatya: "🍑",
    manisa: "🍇",
    hatay: "🫒",
    mugla: "🌊",
    konya: "🌾",
    samsun: "⚓",
    trabzon: "⛰️",
    rize: "🍵",
    ordu: "🌰",
    giresun: "🌰",
    kayseri: "⛰️",
    gaziantep: "🌶️",
    sanliurfa: "🌾",
    diyarbakir: "🧱",
    denizli: "🐓",
    balikesir: "🧀",
    kocaeli: "🏭",
    sakarya: "🚜",
    tekirdag: "🌻",
    canakkale: "🏰",
    eskisehir: "🚄",
    amasya: "🍎",
    tokat: "🍅",
    nigde: "🍏",
    nevsehir: "🎈",
    karaman: "🍎",
    yalova: "🌊",
    duzce: "🌲",
    bolu: "🌲",
  };

  return icons[c] ?? "📍";
}

function routeScore(route: TradeRoute, maxSignals: number) {
  const signalPower = score(route.signals, maxSignals);
  const gpsRate = percent(route.gpsSignals, route.signals);
  const mobileRate = percent(route.mobileSignals, route.signals);
  const visitorPower = Math.min(100, route.uniqueVisitors * 12);

  return Math.min(
    100,
    Math.round(signalPower * 0.48 + gpsRate * 0.22 + mobileRate * 0.18 + visitorPower * 0.12)
  );
}

function timeAgo(value?: string | null) {
  if (!value) return "veri yok";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "veri yok";

  const min = Math.floor((Date.now() - d.getTime()) / 60000);

  if (min < 1) return "şimdi";
  if (min < 60) return `${min} dk önce`;

  const hour = Math.floor(min / 60);

  if (hour < 24) return `${hour} sa önce`;
  return `${Math.floor(hour / 24)} gün önce`;
}

function opportunityLabel(v: number) {
  if (v >= 88) return "Çok Güçlü Fırsat";
  if (v >= 72) return "Takip Edilecek Fırsat";
  if (v >= 50) return "Orta Seviye Sinyal";
  return "Düşük Talep";
}

function opportunityTone(v: number) {
  if (v >= 88) return "text-emerald-700 dark:text-emerald-300";
  if (v >= 72) return "text-blue-700 dark:text-blue-300";
  if (v >= 50) return "text-orange-700 dark:text-orange-300";
  return "text-rose-700 dark:text-rose-300";
}

async function loadImageAsBase64(src: string): Promise<string | null> {
  try {
    const res = await fetch(src);
    const blob = await res.blob();

    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function pdfText(doc: jsPDF, text: unknown, x: number, y: number, options?: any) {
  doc.text(trPdf(text), x, y, options);
}

function pdfSplit(doc: jsPDF, text: unknown, width: number) {
  return doc.splitTextToSize(trPdf(text), width);
}

function pdfFooter(doc: jsPDF, page: number, total?: number) {
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 285, 196, 285);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  pdfText(doc, "HalApp Market Intelligence", 14, 291);
  pdfText(doc, "Gizli Ticari Analiz Raporu", 86, 291);
  pdfText(doc, total ? `Sayfa ${page} / ${total}` : `Sayfa ${page}`, 196, 291, {
    align: "right",
  });
}

async function pdfHeader(doc: jsPDF, title: string, page: number) {
  const logo = await loadImageAsBase64(HALAPP_LOGO);

  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, 210, 36, "F");
  doc.setFillColor(34, 197, 94);
  doc.circle(188, -4, 38, "F");
  doc.setFillColor(20, 184, 166);
  doc.circle(15, 40, 32, "F");

  if (logo) {
    doc.addImage(logo, "PNG", 14, 8, 22, 22);
  } else {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 8, 22, 22, 5, 5, "F");
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(16);
    pdfText(doc, "H", 25, 23, { align: "center" });
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  pdfText(doc, title, 42, 18);
  doc.setFontSize(9);
  pdfText(doc, `Rapor Tarihi: ${new Date().toLocaleString("tr-TR")}`, 42, 26);
  pdfFooter(doc, page);
}

function pdfStatCard(
  doc: jsPDF,
  x: number,
  y: number,
  title: string,
  value: string,
  accent: [number, number, number] = [16, 185, 129]
) {
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, y, 84, 26, 5, 5, "F");
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(x, y, 84, 26, 5, 5, "S");
  doc.setFillColor(...accent);
  doc.roundedRect(x, y, 4, 26, 2, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  pdfText(doc, title, x + 9, y + 9);
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  pdfText(doc, value, x + 9, y + 20);
}

function pdfBar(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  value: number,
  color: [number, number, number] = [16, 185, 129]
) {
  doc.setFillColor(229, 231, 235);
  doc.roundedRect(x, y, width, 4, 2, 2, "F");
  doc.setFillColor(...color);
  doc.roundedRect(x, y, Math.max(4, (width * value) / 100), 4, 2, 2, "F");
}

function pdfTableHeader(doc: jsPDF, y: number, headers: string[]) {
  doc.setFillColor(17, 24, 39);
  doc.roundedRect(14, y, 182, 10, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);

  const xs = [18, 60, 101, 135, 158, 178];

  headers.forEach((h, i) => pdfText(doc, h, xs[i], y + 7));
}

function aiReportText(routes: TradeRoute[], products: TopProduct[]) {
  const leader = routes[0];
  const product = products[0];

  if (!leader && !product) {
    return "Yeterli veri oluştuğunda HalApp Intelligence Engine ürün, şehir ve rota bazlı ticari tavsiye üretecektir.";
  }

  if (!leader) {
    return `${product?.productName} ürünü en yüksek sinyali alan ürün olarak öne çıkıyor. Ürün ilanları, fiyat ve stok seviyeleri takip edilmelidir.`;
  }

  return `${leader.productName} ürününde ${leader.buyerCity} kaynaklı alıcı ilgisi ${leader.listingCity} ilanlarına yoğunlaşmıştır. Bu rota ${leader.signals} sinyal ve %${percent(
    leader.gpsSignals,
    leader.signals
  )} GPS güven oranı ile takip edilmektedir. Tüccar aksiyonu: ${leader.listingCity} tarafındaki ${leader.productName} ilanları öne çıkarılmalı, ${leader.buyerCity} alıcı kitlesine hedefli gösterilmelidir.`;
}

async function downloadMarketReportPdf({
  signals,
  routes,
  products,
  cities,
}: {
  signals: SignalRow[];
  routes: TradeRoute[];
  products: TopProduct[];
  cities: CityStat[];
}) {
  const doc = new jsPDF();
  const sortedRoutes = [...routes].sort((a, b) => b.signals - a.signals);
  const gpsCount = signals.filter((s) => normalize(s.locationSource) === "gps").length;
  const gpsRate = percent(gpsCount, signals.length);
  const leader = sortedRoutes[0];
  const leaderScore = leader
    ? routeScore(leader, Math.max(...sortedRoutes.map((r) => r.signals), 1))
    : 0;

  const logo = await loadImageAsBase64(HALAPP_LOGO);

  doc.setFillColor(5, 8, 22);
  doc.rect(0, 0, 210, 297, "F");
  doc.setFillColor(16, 185, 129);
  doc.circle(175, 42, 62, "F");
  doc.setFillColor(20, 184, 166);
  doc.circle(20, 255, 70, "F");
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(18, 22, 174, 220, 12, 12, "F");

  if (logo) doc.addImage(logo, "PNG", 28, 34, 30, 30);

  doc.setTextColor(17, 24, 39);
  doc.setFontSize(25);
  pdfText(doc, "HALAPP", 28, 85);
  doc.setFontSize(20);
  pdfText(doc, "MARKET INTELLIGENCE", 28, 98);
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  pdfText(doc, "Türkiye Tarım ve Hal Ticaret Analizi", 28, 113);

  doc.setFillColor(240, 253, 244);
  doc.roundedRect(28, 132, 154, 42, 8, 8, "F");
  doc.setTextColor(22, 101, 52);
  doc.setFontSize(11);
  pdfText(doc, "Hazırlayan", 36, 146);
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(16);
  pdfText(doc, "HalApp Intelligence Engine", 36, 158);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  pdfText(doc, `Rapor Tarihi: ${new Date().toLocaleString("tr-TR")}`, 36, 166);
  pdfText(doc, "Gizli Ticari Analiz Raporu", 28, 222);
  pdfFooter(doc, 1, 6);

  doc.addPage();
  await pdfHeader(doc, "Yönetici Özeti", 2);
  pdfStatCard(doc, 14, 52, "Toplam Sinyal", fmt(signals.length));
  pdfStatCard(doc, 106, 52, "GPS Güven", `%${gpsRate}`, [14, 165, 233]);
  pdfStatCard(doc, 14, 86, "Ticaret Rotası", fmt(routes.length), [245, 158, 11]);
  pdfStatCard(doc, 106, 86, "Aktif Ürün", fmt(products.length), [239, 68, 68]);
  pdfStatCard(doc, 14, 120, "Aktif Şehir", fmt(cities.length), [139, 92, 246]);
  pdfStatCard(doc, 106, 120, "Fırsat Skoru", `${leaderScore}/100`);

  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  pdfText(doc, "AI Genel Değerlendirme", 14, 170);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 178, 182, 54, 8, 8, "F");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(pdfSplit(doc, aiReportText(sortedRoutes, products), 165), 22, 192);
  pdfFooter(doc, 2, 6);

  doc.addPage();
  await pdfHeader(doc, "En Sıcak Ürünler", 3);

  let y = 54;
  const maxProduct = Math.max(...products.map((p) => p.signals), 1);

  products.slice(0, 12).forEach((p, i) => {
    const value = score(p.signals, maxProduct);

    doc.setFillColor(i % 2 === 0 ? 248 : 255, 250, 252);
    doc.roundedRect(14, y - 5, 182, 14, 4, 4, "F");
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    pdfText(doc, `${i + 1}. ${safeText(p.productName, 30)}`, 18, y + 3);
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    pdfText(doc, `${fmt(p.signals)} sinyal`, 84, y + 3);
    pdfBar(doc, 124, y, 52, value);
    doc.setFontSize(8);
    doc.setTextColor(22, 101, 52);
    pdfText(doc, `${value}/100`, 180, y + 3);
    y += 17;
  });

  pdfFooter(doc, 3, 6);

  doc.addPage();
  await pdfHeader(doc, "Ticaret Rotaları", 4);
  y = 54;
  pdfTableHeader(doc, y, ["Ürün", "Alıcı", "İlan", "Sinyal", "GPS", "Kişi"]);
  y += 16;

  sortedRoutes.slice(0, 18).forEach((r, i) => {
    doc.setFillColor(i % 2 === 0 ? 248 : 255, 250, 252);
    doc.roundedRect(14, y - 6, 182, 12, 3, 3, "F");
    doc.setFontSize(8);
    doc.setTextColor(17, 24, 39);
    pdfText(doc, safeText(r.productName, 18), 18, y);
    pdfText(doc, safeText(r.buyerCity, 14), 60, y);
    pdfText(doc, safeText(r.listingCity, 14), 101, y);
    pdfText(doc, String(r.signals), 135, y);
    pdfText(doc, `%${percent(r.gpsSignals, r.signals)}`, 158, y);
    pdfText(doc, String(r.uniqueVisitors), 178, y);
    y += 13;
  });

  pdfFooter(doc, 4, 6);

  doc.addPage();
  await pdfHeader(doc, "AI Ticaret Danışmanı", 5);
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, 54, 182, 72, 10, 10, "F");
  doc.setFontSize(12);
  doc.setTextColor(22, 101, 52);
  pdfText(doc, "Bugünün Ticari Fırsatı", 24, 72);
  doc.setFontSize(24);
  doc.setTextColor(17, 24, 39);
  pdfText(doc, leader ? safeText(leader.productName, 24) : "Veri Bekleniyor", 24, 90);
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);

  const opportunityText = leader
    ? `${leader.buyerCity} tarafında ${leader.productName} ilgisi güçleniyor. Bu ilgi en çok ${leader.listingCity} ilanlarına yönelmiş durumda.`
    : "Yeterli sinyal oluştuğunda bu bölüm otomatik fırsat yorumu üretir.";

  doc.text(pdfSplit(doc, opportunityText, 150), 24, 104);

  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  pdfText(doc, "Net Tüccar Aksiyonu", 14, 150);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 160, 182, 52, 8, 8, "F");

  const actionText = leader
    ? `${leader.listingCity} tarafındaki ${leader.productName} ilanlarını öne çıkar. ${leader.buyerCity} alıcı kitlesine hedefli göster. Stok, fiyat ve satıcı temasını kontrol et.`
    : "Sinyal arttıkça sistem aksiyon önerilerini otomatik olarak oluşturacaktır.";

  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text(pdfSplit(doc, actionText, 165), 24, 178);
  pdfFooter(doc, 5, 6);

  doc.addPage();
  await pdfHeader(doc, "Premium Aksiyon Planı", 6);
  doc.setFontSize(18);
  doc.setTextColor(17, 24, 39);
  pdfText(doc, "Önerilen Ticari Hamleler", 14, 60);

  const actionLines = [
    leader
      ? `${leader.listingCity} pazarındaki ${leader.productName} ilanları vitrine alınmalı.`
      : "Lider ürün oluşunca vitrin önerisi burada üretilecek.",
    leader
      ? `${leader.buyerCity} alıcı kitlesine hedefli gösterim yapılmalı.`
      : "Alıcı şehir verisi oluşunca hedef pazar önerisi üretilecek.",
    "Ürün fiyatı, stok durumu ve satıcı cevap süresi günlük kontrol edilmeli.",
    "Fırsat skoru 85 üstüne çıkan ürünlerde 3 gün vitrin kampanyası önerilir.",
  ];

  y = 78;

  actionLines.forEach((line, i) => {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y - 7, 182, 18, 5, 5, "F");
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    pdfText(doc, `${i + 1}. ${line}`, 20, y + 3);
    y += 26;
  });

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  pdfText(doc, "Bu rapor HalApp Market Intelligence tarafından otomatik üretilmiştir.", 14, 246);
  pdfText(doc, "HalApp 2026", 14, 255);
  pdfFooter(doc, 6, 6);

  doc.save("halapp-premium-market-intelligence.pdf");
}

async function downloadTradeRoutesPdf(routes: TradeRoute[]) {
  const doc = new jsPDF();
  const sortedRoutes = [...routes].sort((a, b) => b.signals - a.signals);

  await pdfHeader(doc, "HALAPP - Ticaret Rotaları Premium Raporu", 1);

  pdfStatCard(doc, 14, 52, "Toplam Rota", fmt(sortedRoutes.length));
  pdfStatCard(doc, 106, 52, "Lider Ürün", safeText(sortedRoutes[0]?.productName, 16), [
    14, 165, 233,
  ]);

  let y = 98;

  pdfTableHeader(doc, y, ["Ürün", "Alıcı", "İlan", "Sinyal", "GPS", "Kişi"]);
  y += 16;

  sortedRoutes.slice(0, 32).forEach((r, i) => {
    if (y > 275) {
      pdfFooter(doc, doc.getNumberOfPages());
      doc.addPage();
      y = 24;
    }

    doc.setFillColor(i % 2 === 0 ? 248 : 255, 250, 252);
    doc.roundedRect(14, y - 6, 182, 12, 3, 3, "F");
    doc.setFontSize(8);
    doc.setTextColor(17, 24, 39);
    pdfText(doc, safeText(r.productName, 18), 18, y);
    pdfText(doc, safeText(r.buyerCity, 14), 60, y);
    pdfText(doc, safeText(r.listingCity, 14), 101, y);
    pdfText(doc, String(r.signals), 135, y);
    pdfText(doc, `%${percent(r.gpsSignals, r.signals)}`, 158, y);
    pdfText(doc, String(r.uniqueVisitors), 178, y);
    y += 13;
  });

  pdfFooter(doc, doc.getNumberOfPages());
  doc.save("halapp-premium-ticaret-rotalari.pdf");
}

function toneClass(tone: IntelligenceAlert["tone"]) {
  if (tone === "hot") {
    return {
      box: "border-rose-500/25 bg-rose-500/10",
      text: "text-rose-700 dark:text-rose-300",
      bar: "from-rose-500 via-orange-400 to-yellow-300",
    };
  }

  if (tone === "warn") {
    return {
      box: "border-orange-500/25 bg-orange-500/10",
      text: "text-orange-700 dark:text-orange-300",
      bar: "from-orange-500 via-yellow-400 to-emerald-400",
    };
  }

  if (tone === "good") {
    return {
      box: "border-emerald-500/25 bg-emerald-500/10",
      text: "text-emerald-700 dark:text-emerald-300",
      bar: "from-emerald-500 via-cyan-400 to-blue-400",
    };
  }

  return {
    box: "border-blue-500/25 bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-300",
    bar: "from-blue-500 via-cyan-400 to-emerald-400",
  };
}

function MiniCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-2xl">{icon}</div>
      <div className="mt-3 text-[10px] font-black uppercase tracking-wide text-zinc-400 dark:text-white/35">
        {label}
      </div>
      <div className="mt-1 truncate text-xl font-black text-zinc-950 dark:text-white">
        {value}
      </div>
    </div>
  );
}

function AlertCard({ item }: { item: IntelligenceAlert }) {
  const t = toneClass(item.tone);

  return (
    <div className={["rounded-[28px] border p-5", t.box].join(" ")}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-4xl">{item.icon}</div>
          <div className="mt-4 text-xl font-black text-zinc-950 dark:text-white">
            {item.title}
          </div>
          <div className={["mt-1 text-xs font-black uppercase tracking-wide", t.text].join(" ")}>
            {item.subtitle}
          </div>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-zinc-600 dark:text-white/55">
            {item.desc}
          </p>
        </div>

        <div
          className={[
            "shrink-0 rounded-full bg-white/70 px-3 py-1 text-xs font-black dark:bg-white/[0.08]",
            t.text,
          ].join(" ")}
        >
          {item.score}/100
        </div>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
        <div
          className={["h-full rounded-full bg-gradient-to-r", t.bar].join(" ")}
          style={{ width: `${item.score}%` }}
        />
      </div>
    </div>
  );
}

function OpportunityCard({
  route,
  maxSignals,
}: {
  route?: TradeRoute;
  maxSignals: number;
}) {
  const s = route ? routeScore(route, maxSignals) : 0;

  return (
    <div className="relative overflow-hidden rounded-[36px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0b1021]">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-[80px]" />

      <div className="relative">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-zinc-500 dark:text-white/45">
          MARKET INTELLIGENCE SCORE
        </div>

        <div className="mt-3 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-3xl font-black text-zinc-950 dark:text-white">
              Ticaret Fırsat Skoru
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/50">
              Sinyal gücü, GPS güveni, mobil hareket ve benzersiz kişi verisine göre hesaplanır.
            </p>
          </div>

          <div className="text-left xl:text-right">
            <div className="text-7xl font-black text-zinc-950 dark:text-white">
              {s || "—"}
            </div>
            <div className={`text-sm font-black ${opportunityTone(s)}`}>
              {route ? opportunityLabel(s) : "Veri bekleniyor"}
            </div>
          </div>
        </div>

        {route ? (
          <div className="mt-6 rounded-[28px] border border-emerald-500/20 bg-emerald-500/10 p-5">
            <div className="text-xl font-black text-zinc-950 dark:text-white">
              {productEmoji(route.productName)} {route.productName}: {cityIcon(route.buyerCity)}{" "}
              {route.buyerCity} → {cityIcon(route.listingCity)} {route.listingCity}
            </div>

            <div className="mt-2 text-sm font-semibold text-zinc-600 dark:text-white/55">
              {fmt(route.signals)} sinyal • GPS %{percent(route.gpsSignals, route.signals)} •{" "}
              {fmt(route.uniqueVisitors)} kişi • son hareket {timeAgo(route.lastAt)}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AiAdvisorCard({
  route,
  topProduct,
  gpsRate,
}: {
  route?: TradeRoute;
  topProduct?: TopProduct;
  gpsRate: number;
}) {
  if (!route) {
    return (
      <div className="relative overflow-hidden rounded-[36px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-cyan-500/10 p-6">
        <div className="text-5xl">🧠</div>
        <h3 className="mt-5 text-3xl font-black text-zinc-950 dark:text-white">
          AI Ticaret Danışmanı
        </h3>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-zinc-600 dark:text-white/55">
          Yeterli ticaret rotası oluşunca sistem günlük fırsat yorumunu, ürün yönünü ve tüccar aksiyonunu gösterecek.
        </p>
      </div>
    );
  }

  const routeGps = percent(route.gpsSignals, route.signals);
  const routeMobile = percent(route.mobileSignals, route.signals);

  return (
    <div className="relative overflow-hidden rounded-[36px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-cyan-500/10 p-6">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/15 blur-[90px]" />

      <div className="relative">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">
              AI TRADE ADVISOR
            </div>

            <h3 className="mt-3 text-4xl font-black tracking-tight text-zinc-950 dark:text-white">
              Bugünün Fırsatı: {productEmoji(route.productName)} {route.productName}
            </h3>

            <p className="mt-4 max-w-4xl text-base font-semibold leading-relaxed text-zinc-700 dark:text-white/60">
              {route.buyerCity} tarafında {route.productName} ilgisi güçleniyor.
              Bu ilgi en çok {route.listingCity} ilanlarına yönelmiş. GPS güveni %
              {routeGps}, mobil hareket %{routeMobile}. Tüccar için öneri: stok,
              fiyat ve satıcı teması hemen kontrol edilmeli.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/40 bg-white/70 p-5 text-center dark:border-white/10 dark:bg-white/[0.07]">
            <div className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-white/40">
              Fırsat Skoru
            </div>
            <div className="mt-2 text-6xl font-black text-zinc-950 dark:text-white">
              {Math.max(70, Math.min(100, routeScore(route, route.signals)))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <MiniCard icon="🚚" label="Rota" value={`${route.buyerCity} → ${route.listingCity}`} />
          <MiniCard icon="📡" label="Sinyal" value={fmt(route.signals)} />
          <MiniCard icon="🎯" label="GPS Güven" value={`%${routeGps}`} />
          <MiniCard icon="🔥" label="Lider Ürün" value={topProduct?.productName || route.productName} />
        </div>

        <div className="mt-6 rounded-[28px] border border-white/40 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.06]">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-white/40">
            Net Tüccar Aksiyonu
          </div>

          <div className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
            {route.listingCity} tarafındaki {route.productName} ilanlarını öne çıkar,
            {route.buyerCity} alıcılarına hedefli göster.
          </div>

          <div className="mt-3 text-sm font-semibold text-zinc-500 dark:text-white/50">
            Genel GPS güven oranı: %{gpsRate}. Bu oran yükseldikçe pazar sinyali daha güvenilir okunur.
          </div>
        </div>
      </div>
    </div>
  );
}

function BoostProductCard({
  product,
  listingId,
}: {
  product?: string;
  listingId?: string | null;
}) {
  const productName = product || "Lider Ürün";
  const hasListing = Boolean(listingId);

  function goBoost() {
    if (!listingId) {
      const q = new URLSearchParams({
        product: productName,
        source: "market_intelligence",
      });

      window.location.href = `/create-listing?${q.toString()}`;
      return;
    }

    const q = new URLSearchParams({
      product_code: "featured_7d",
      listing_id: listingId,
      source: "market_intelligence",
    });

    window.location.href = `/payment?${q.toString()}`;
  }

  return (
    <div className="overflow-hidden rounded-[34px] border border-emerald-500/20 bg-emerald-500/10 p-6">
      <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
        GELİR MOTORU
      </div>

      <h2 className="mt-2 text-3xl font-black text-zinc-950 dark:text-white">
        {hasListing ? "Bu ilanı öne çıkar" : "Bu ürün için ilan oluştur"}
      </h2>

      <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-600 dark:text-white/55">
        {hasListing
          ? `${productEmoji(productName)} ${productName} için pazar hareketi oluştuysa, ilgili ilanı vitrine çıkararak alıcıya daha hızlı ulaşabilirsin.`
          : `${productEmoji(productName)} ${productName} için pazar hareketi var ama bu ürüne ait aktif ilan bulunamadı. İlan oluşturup talebi yakalayabilirsin.`}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MiniCard icon="⭐" label="Boost 24 Saat" value="₺499" />
        <MiniCard icon="🚀" label="Boost 3 Gün" value="₺999" />
        <MiniCard icon="👑" label="Vitrin 7 Gün" value="₺2.999" />
      </div>

      <button
        type="button"
        onClick={goBoost}
        className="mt-5 rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:shadow-xl dark:bg-white dark:text-zinc-950"
      >
        {hasListing
          ? `${productEmoji(productName)} ${productName} ilanını öne çıkar →`
          : `${productEmoji(productName)} ${productName} ilanı oluştur →`}
      </button>
    </div>
  );
}
function RouteLine({ route, maxSignals }: { route: TradeRoute; maxSignals: number }) {
  const power = routeScore(route, maxSignals);
  const gps = percent(route.gpsSignals, route.signals);

  return (
    <div className="rounded-[26px] border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_90px] md:items-center">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-wide text-zinc-400 dark:text-white/35">
            Alıcı Talebi
          </div>
          <div className="mt-1 truncate text-sm font-black text-zinc-950 dark:text-white">
            {cityIcon(route.buyerCity)} {route.buyerCity}
          </div>
        </div>

        <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-zinc-950 text-white md:flex dark:bg-white dark:text-zinc-950">
          →
        </div>

        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-wide text-zinc-400 dark:text-white/35">
            İlan Pazarı
          </div>
          <div className="mt-1 truncate text-sm font-black text-zinc-950 dark:text-white">
            {cityIcon(route.listingCity)} {route.listingCity} /{" "}
            {productEmoji(route.productName)} {route.productName}
          </div>
        </div>

        <div className="text-left md:text-right">
          <div className="text-sm font-black text-zinc-950 dark:text-white">
            {power}/100
          </div>
          <div className="mt-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            GPS %{gps}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportButton({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: string;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[30px] border border-zinc-200 bg-white p-6 text-left transition hover:-translate-y-1 hover:shadow-2xl dark:border-white/10 dark:bg-white/[0.04]"
    >
      <div className="text-4xl">{icon}</div>
      <div className="mt-4 text-2xl font-black text-zinc-950 dark:text-white">
        {title}
      </div>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/50">
        {desc}
      </p>
      <div className="mt-5 inline-flex rounded-full bg-zinc-950 px-4 py-2 text-xs font-black text-white dark:bg-white dark:text-zinc-950">
        PDF İndir →
      </div>
    </button>
  );
}

export default function IntelligenceCenter({
  signals,
  tradeRoutes,
  topProducts,
  cities,
}: Props) {
  const [alertLimit, setAlertLimit] = useState(70);
  const [productsFollow, setProductsFollow] = useState(
    "Limon, Kayısı, Avokado, Blueberry"
  );
  const [citiesFollow, setCitiesFollow] = useState(
    "Antalya, İstanbul, Mersin, İzmir"
  );

  const activeRoutes = useMemo(
    () => tradeRoutes.filter((r) => Number(r.signals || 0) > 0),
    [tradeRoutes]
  );

  const maxSignals = Math.max(...activeRoutes.map((r) => r.signals), 1);

  const sortedRoutes = useMemo(() => {
    return [...activeRoutes].sort(
      (a, b) => routeScore(b, maxSignals) - routeScore(a, maxSignals)
    );
  }, [activeRoutes, maxSignals]);

  const leaderRoute = sortedRoutes[0];
  const leaderProduct = topProducts[0];

  const gpsCount = useMemo(
    () => signals.filter((s) => normalize(s.locationSource) === "gps").length,
    [signals]
  );

  const gpsRate = percent(gpsCount, signals.length);

  const alerts = useMemo((): IntelligenceAlert[] => {
    const routeAlerts: IntelligenceAlert[] = sortedRoutes
      .map((r): IntelligenceAlert => {
        const s = routeScore(r, maxSignals);

        return {
          icon: "🚨",
          title: `${r.buyerCity} → ${r.listingCity}`,
          subtitle: `${r.productName} talep alarmı`,
          desc: `${r.productName} için ${r.buyerCity} tarafından ${r.listingCity} ilanlarına ${fmt(
            r.signals
          )} gerçek sinyal geldi. ${fmt(r.uniqueVisitors)} benzersiz kişi görünüyor.`,
          score: s,
          tone: s >= 85 ? "hot" : s >= 70 ? "warn" : "good",
        };
      })
      .filter((x) => x.score >= alertLimit)
      .slice(0, 6);

    const maxTopProductSignals = Math.max(topProducts[0]?.signals || 1, 1);

    const productAlerts: IntelligenceAlert[] = topProducts
      .slice(0, 4)
      .map((p, i): IntelligenceAlert => {
        const s = score(p.signals, maxTopProductSignals);

        return {
          icon: productEmoji(p.productName),
          title: `${p.productName} ürün ateşi`,
          subtitle: i === 0 ? "lider ürün" : "yükselen ürün",
          desc: `${p.productName} son ölçümde ${fmt(
            p.signals
          )} sinyal aldı. Stok, fiyat ve vitrin kontrolü önerilir.`,
          score: s,
          tone: s >= 85 ? "hot" : s >= 70 ? "warn" : "info",
        };
      });

    return [...routeAlerts, ...productAlerts]
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [sortedRoutes, maxSignals, alertLimit, topProducts]);

  return (
    <section className="grid gap-6">
      <OpportunityCard route={leaderRoute} maxSignals={maxSignals} />

      <div id="ai-advisor" className="scroll-mt-6">
        <AiAdvisorCard
          route={leaderRoute}
          topProduct={leaderProduct}
          gpsRate={gpsRate}
        />
      </div>

      <BoostProductCard
        product={leaderProduct?.productName || leaderRoute?.productName}
      />

      <div
        id="alerts"
        className="scroll-mt-6 overflow-hidden rounded-[34px] border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1021]"
      >
        <div className="border-b border-zinc-200 p-6 dark:border-white/10">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-white/45">
                SMART ALERT CENTER
              </div>
              <h2 className="mt-2 text-3xl font-black text-zinc-950 dark:text-white">
                Akıllı Ticaret Uyarıları
              </h2>
              <p className="mt-2 max-w-4xl text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/50">
                Talep patlaması, sıcak rota, ürün ateşi ve GPS yoğunluğu gerçek
                sinyal verisinden otomatik üretilir.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4">
              <div className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Alarm Eşiği
              </div>
              <div className="mt-1 text-3xl font-black text-zinc-950 dark:text-white">
                %{alertLimit}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <MiniCard icon="🚨" label="Aktif Uyarı" value={fmt(alerts.length)} />
            <MiniCard icon="📡" label="GPS Güven" value={`%${gpsRate}`} />
            <MiniCard icon="🚚" label="Rota" value={fmt(activeRoutes.length)} />
            <MiniCard
              icon="🔥"
              label="Lider Ürün"
              value={leaderProduct?.productName || "—"}
            />
          </div>
        </div>

        <div className="p-6">
          {alerts.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {alerts.map((item, index) => (
                <AlertCard key={`${item.title}-${index}`} item={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-10 text-center dark:border-white/10 dark:bg-white/[0.035]">
              <div className="text-5xl">🔕</div>
              <div className="mt-4 text-xl font-black text-zinc-950 dark:text-white">
                Şu an kritik alarm yok
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        id="trade-routes-report"
        className="scroll-mt-6 overflow-hidden rounded-[34px] border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1021]"
      >
        <div className="border-b border-zinc-200 p-6 dark:border-white/10">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-white/45">
                TRADE ROUTE COMMAND CENTER
              </div>
              <h2 className="mt-2 text-3xl font-black text-zinc-950 dark:text-white">
                Ticaret Rotaları Özeti
              </h2>
              <p className="mt-2 max-w-4xl text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/50">
                Alıcı şehirden ilan şehrine akan ürün ilgisini gösterir. Bu
                bölüm tüccara “hangi ürünü hangi pazara yönlendireyim?”
                cevabını verir.
              </p>
            </div>

            <button
              type="button"
              onClick={() => downloadTradeRoutesPdf(sortedRoutes)}
              className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:shadow-xl dark:bg-white dark:text-zinc-950"
            >
              PDF İndir →
            </button>
          </div>
        </div>

        <div className="p-6">
          {sortedRoutes.length ? (
            <div className="space-y-3">
              {sortedRoutes.slice(0, 8).map((route, index) => (
                <RouteLine
                  key={`${route.productName}-${route.buyerCity}-${route.listingCity}-${index}`}
                  route={route}
                  maxSignals={maxSignals}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-10 text-center dark:border-white/10 dark:bg-white/[0.035]">
              <div className="text-5xl">🚚</div>
              <div className="mt-4 text-xl font-black text-zinc-950 dark:text-white">
                Henüz ticaret rotası oluşmadı
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        id="settings"
        className="scroll-mt-6 overflow-hidden rounded-[34px] border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1021]"
      >
        <div className="border-b border-zinc-200 p-6 dark:border-white/10">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-white/45">
            RADAR SETTINGS
          </div>
          <h2 className="mt-2 text-3xl font-black text-zinc-950 dark:text-white">
            Tüccar Radar Ayarları
          </h2>
        </div>

        <div className="grid gap-5 p-6 xl:grid-cols-2">
          <div className="rounded-[30px] border border-zinc-200 bg-zinc-50 p-5 dark:border-white/10 dark:bg-white/[0.025]">
            <label className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-white/40">
              Takip Edilen Ürünler
            </label>

            <textarea
              value={productsFollow}
              onChange={(e) => setProductsFollow(e.target.value)}
              className="mt-3 min-h-32 w-full resize-none rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-bold text-zinc-950 outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {productsFollow
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean)
                .slice(0, 8)
                .map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300"
                  >
                    {productEmoji(p)} {p}
                  </span>
                ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-zinc-200 bg-zinc-50 p-5 dark:border-white/10 dark:bg-white/[0.025]">
            <label className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-white/40">
              Takip Edilen Şehirler
            </label>

            <textarea
              value={citiesFollow}
              onChange={(e) => setCitiesFollow(e.target.value)}
              className="mt-3 min-h-32 w-full resize-none rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-bold text-zinc-950 outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {citiesFollow
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean)
                .slice(0, 8)
                .map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-700 dark:text-blue-300"
                  >
                    {cityIcon(c)} {c}
                  </span>
                ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-zinc-200 bg-zinc-50 p-5 dark:border-white/10 dark:bg-white/[0.025] xl:col-span-2">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-white/40">
                  Alarm Eşiği
                </div>
                <div className="mt-1 text-5xl font-black text-zinc-950 dark:text-white">
                  %{alertLimit}
                </div>
              </div>

              <input
                type="range"
                min={30}
                max={95}
                value={alertLimit}
                onChange={(e) => setAlertLimit(Number(e.target.value))}
                className="w-full max-w-2xl accent-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div
        id="reports"
        className="scroll-mt-6 overflow-hidden rounded-[34px] border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1021]"
      >
        <div className="border-b border-zinc-200 p-6 dark:border-white/10">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-white/45">
                PDF REPORT CENTER
              </div>
              <h2 className="mt-2 text-3xl font-black text-zinc-950 dark:text-white">
                HalApp Rapor Merkezi
              </h2>
              <p className="mt-2 max-w-4xl text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/50">
                HalApp gerçek logosu ile premium PDF rapor üretir.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4">
              <div className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Premium Değer
              </div>
              <div className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">
                ₺7.899 / Ay
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-6 xl:grid-cols-2">
          <ReportButton
            icon="🚚"
            title="Ticaret Rotaları PDF"
            desc="Ürün, alıcı şehir, ilan şehri, sinyal, GPS güveni ve kişi sayısını HalApp logolu PDF olarak indir."
            onClick={() => downloadTradeRoutesPdf(sortedRoutes)}
          />

          <ReportButton
            icon="📊"
            title="Market Intelligence PDF"
            desc="Genel pazar özeti, lider ürünler, sıcak rotalar ve AI ticaret yorumunu premium raporda indir."
            onClick={() =>
              downloadMarketReportPdf({
                signals,
                routes: sortedRoutes,
                products: topProducts,
                cities,
              })
            }
          />
        </div>
      </div>
    </section>
  );
}