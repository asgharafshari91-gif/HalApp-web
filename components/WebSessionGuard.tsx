"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length !== 2) return null;

  return parts.pop()?.split(";").shift() ?? null;
}

export default function WebSessionGuard() {
  useEffect(() => {
    let alive = true;

    async function checkSession() {
      try {
        const sessionKey = getCookie("halapp_web_session_key");
        if (!sessionKey) return;

        const { data } = await supabase
          .from("web_qr_login_sessions")
          .select("status")
          .eq("session_key", sessionKey)
          .maybeSingle();

        if (!alive) return;

        if (data?.status === "revoked") {
          await supabase.auth.signOut();
          document.cookie =
            "halapp_web_session_key=; path=/; max-age=0; SameSite=Lax";
          window.location.href = "/auth?reason=web_session_revoked";
        }
      } catch (e) {
        console.error("WEB SESSION GUARD ERROR:", e);
      }
    }

    checkSession();

    const timer = window.setInterval(checkSession, 15000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  return null;
}