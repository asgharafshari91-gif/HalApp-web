"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ConsentValue } from "./consent";
import { readConsent, writeConsent } from "./consent";

type ConsentCtx = {
  consent: ConsentValue;
  accept: () => void;
  reject: () => void;
  reset: () => void; // ayarlardan tekrar sorulsun diye
};

const Ctx = createContext<ConsentCtx | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentValue>("unset");

  useEffect(() => {
    setConsent(readConsent());
  }, []);

  const api = useMemo<ConsentCtx>(() => {
    return {
      consent,
      accept: () => {
        writeConsent("accepted");
        setConsent("accepted");
      },
      reject: () => {
        writeConsent("rejected");
        setConsent("rejected");
      },
      reset: () => {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("halapp-cookie-consent");
          document.cookie = `halapp-cookie-consent=; Path=/; Max-Age=0; SameSite=Lax`;
        }
        setConsent("unset");
      },
    };
  }, [consent]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useConsent() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useConsent must be used within ConsentProvider");
  return v;
}