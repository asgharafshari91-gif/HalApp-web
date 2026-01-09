"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { readPendingConsent, clearPendingConsent } from "@/lib/consent";

export default function ConsentSync() {
  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        const pending = readPendingConsent();
        if (!pending) return;

        const { data } = await supabase.auth.getSession();
        const uid = data.session?.user?.id;
        if (!uid) return;

        await supabase.from("user_consents").upsert(
          {
            user_id: uid,
            necessary: true,
            analytics: pending.analytics,
            marketing: pending.marketing,
            terms_accepted: pending.termsAccepted,
            privacy_accepted: pending.privacyAccepted,
            explicit_consent: pending.explicitConsent,
            accepted_at: pending.acceptedAt,
            user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
          },
          { onConflict: "user_id" }
        );

        if (alive) clearPendingConsent();
      } catch {
        // sessiz geç
      }
    }

    run();

    const { data: sub } = supabase.auth.onAuthStateChange(() => run());
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return null;
}