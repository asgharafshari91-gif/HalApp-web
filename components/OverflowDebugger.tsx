"use client";

import { useEffect, useMemo, useState } from "react";

type Hit = {
  tag: string;
  id: string;
  cls: string;
  left: number;
  right: number;
  width: number;
};

function pick(el: Element): Hit {
  const r = (el as HTMLElement).getBoundingClientRect();
  return {
    tag: el.tagName.toLowerCase(),
    id: (el as HTMLElement).id || "",
    cls: ((el as HTMLElement).className || "").toString().slice(0, 160),
    left: Math.round(r.left),
    right: Math.round(r.right),
    width: Math.round(r.width),
  };
}

export default function OverflowDebugger({ enabled = true }: { enabled?: boolean }) {
  const [hits, setHits] = useState<Hit[]>([]);
  const [w, setW] = useState<number>(0);

  const text = useMemo(() => {
    if (!enabled) return "";
    if (!hits.length) return `✅ Overflow yok (w=${w})`;
    return `❌ Overflow var (w=${w}) • ${hits.length} eleman`;
  }, [enabled, hits.length, w]);

  useEffect(() => {
    if (!enabled) return;

    const scan = () => {
      const vw = Math.ceil(window.innerWidth);
      setW(vw);

      const all = Array.from(document.body.querySelectorAll("*"));
      const bad: Hit[] = [];

      for (const el of all) {
        // görünmeyenleri geç
        const style = window.getComputedStyle(el);
        if (style.display === "none") continue;

        const r = (el as HTMLElement).getBoundingClientRect();

        // 1px tolerans
        if (r.right > vw + 1 || r.left < -1) {
          bad.push(pick(el));
        }
        if (bad.length >= 12) break;
      }

      setHits(bad);
    };

    scan();
    const t = window.setInterval(scan, 600);

    window.addEventListener("resize", scan);
    window.addEventListener("orientationchange", scan);

    return () => {
      window.clearInterval(t);
      window.removeEventListener("resize", scan);
      window.removeEventListener("orientationchange", scan);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-3 left-3 z-[9999] max-w-[92vw] rounded-2xl border border-black/10 bg-white/90 p-3 text-[11px] font-bold text-black shadow-lg dark:border-white/10 dark:bg-black/80 dark:text-white">
      <div className="flex items-center justify-between gap-2">
        <div className="truncate">{text}</div>
        <button
          className="rounded-xl border border-black/10 bg-black/5 px-2 py-1 text-[11px] font-black dark:border-white/10 dark:bg-white/10"
          onClick={() => {
            // bir kere daha tarat
            const ev = new Event("resize");
            window.dispatchEvent(ev);
          }}
        >
          Yenile
        </button>
      </div>

      {hits.length ? (
        <div className="mt-2 space-y-1">
          {hits.map((h, i) => (
            <div key={i} className="break-words opacity-90">
              {i + 1}. <b>{h.tag}</b>
              {h.id ? `#${h.id}` : ""} • w:{h.width} • L:{h.left} R:{h.right}
              <div className="opacity-70">{h.cls}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}