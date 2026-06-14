"use client";

import { useState } from "react";

export default function SupportRequest() {
  const [loading, setLoading] = useState(false);

  async function submitTicket(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    setTimeout(() => {
      alert("Destek talebiniz alındı.");
      setLoading(false);
    }, 1200);
  }

  return (
    <section id="support-request">
      <div className="mb-4">
        <div className="inline-flex rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-black text-rose-700 dark:text-rose-200">
          DESTEK TALEBİ
        </div>

        <h2 className="mt-3 text-3xl font-black text-zinc-950 dark:text-white">
          Yeni Talep Oluştur
        </h2>
      </div>

      <form
        onSubmit={submitTicket}
        className="rounded-[34px] border border-black/10 bg-white/75 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-black">
              Konu
            </label>

            <input
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-black/20"
              placeholder="Örn: Mesajlaşma Sorunu"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black">
              Kategori
            </label>

            <select className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-black/20">
              <option>KYC</option>
              <option>Premium</option>
              <option>Mesajlaşma</option>
              <option>Favoriler</option>
              <option>QR Giriş</option>
              <option>Diğer</option>
            </select>
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-black">
            Açıklama
          </label>

          <textarea
            rows={6}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-black/20"
            placeholder="Sorununuzu detaylı açıklayın..."
          />
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-black">
            Dosya Yükle (V2)
          </label>

          <div className="rounded-2xl border border-dashed border-black/20 p-6 text-center text-sm font-bold text-zinc-500 dark:border-white/15">
            Fotoğraf / Video desteği V2 sürümünde aktif olacak
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 h-14 w-full rounded-2xl bg-emerald-500 text-sm font-black text-black shadow-[0_20px_60px_rgba(34,197,94,.22)] transition hover:bg-emerald-400"
        >
          {loading
            ? "Gönderiliyor..."
            : "Destek Talebi Oluştur"}
        </button>
      </form>
    </section>
  );
}