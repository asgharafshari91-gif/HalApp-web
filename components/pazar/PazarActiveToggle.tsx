"use client";

import { useState, useTransition } from "react";
import { setPazarActive } from "@/lib/api/pazar";
import { useToast } from "@/components/ui/toast";

type Props = {
  id: string;
  initialActive: boolean;
};

export default function PazarActiveToggle({ id, initialActive }: Props) {
  const [active, setActive] = useState(initialActive);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  function toggle() {
    startTransition(async () => {
      try {
        const next = !active;
        await setPazarActive(id, next);
        setActive(next);

        toast({
          variant: "success",
          title: "Güncellendi",
          message: next ? "İlan aktif" : "İlan pasif",
        });
      } catch (e: any) {
        toast({
          variant: "error",
          title: "Hata",
          message: e.message ?? "Güncellenemedi",
        });
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={[
        "rounded-full px-4 py-2 text-xs font-black transition",
        active
          ? "bg-emerald-500 text-black hover:bg-emerald-400"
          : "bg-black/10 text-black/70 hover:bg-black/20",
        pending ? "opacity-60 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {active ? "Aktif" : "Pasif"}
    </button>
  );
}