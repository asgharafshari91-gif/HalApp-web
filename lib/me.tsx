"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type MeProfile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  city: string | null;
  district: string | null;
  avatar_url: string | null;
  phone: string | null;
  email: string | null;
  is_premium?: boolean | null;
  verified?: boolean | null;
  kyc_status?: string | null;
};

type MeCtx = {
  loading: boolean;
  authed: boolean;
  userId: string | null;
  profile: MeProfile | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<MeCtx | null>(null);

async function fetchOrCreateProfile(uid: string, phone?: string | null, email?: string | null) {
  const { data: p, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
  if (error) throw error;

  if (!p) {
    const { error: ie } = await supabase.from("profiles").insert({
      id: uid,
      phone: phone ?? null,
      email: email ?? null,
    });
    if (ie) throw ie;

    const { data: p2, error: e2 } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    if (e2) throw e2;
    return p2 as MeProfile | null;
  }

  // phone/email boşsa tamamla
  if ((!p.phone && phone) || (!p.email && email)) {
    await supabase
      .from("profiles")
      .update({ phone: p.phone ?? phone ?? null, email: p.email ?? email ?? null })
      .eq("id", uid);

    const { data: p3 } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    return (p3 ?? p) as MeProfile;
  }

  return p as MeProfile;
}

export function MeProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<MeProfile | null>(null);

  const authed = Boolean(userId);

  const refresh = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const s = data.session;

      if (!s?.user?.id) {
        setUserId(null);
        setProfile(null);
        return;
      }

      const uid = s.user.id;
      setUserId(uid);

      const p = await fetchOrCreateProfile(uid, s.user.phone ?? null, s.user.email ?? null);
      setProfile(p);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserId(null);
    setProfile(null);
  };

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ loading, authed, userId, profile, refresh, signOut }),
    [loading, authed, userId, profile]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMe() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMe must be used within MeProvider");
  return ctx;
}