"use client";

/**
 * ✅ Web Push (Firebase Messaging) helper
 * - SW register
 * - permission
 * - FCM token
 * - Supabase push_tokens upsert (token unique)
 * - enable/disable
 * - foreground listener
 */

import { supabase } from "@/lib/supabaseClient";
import { getMessagingSafe, getVapidKey } from "@/lib/firebaseClient";
import { getWebPushSupport } from "@/lib/browserPush";
import {
  getToken,
  deleteToken,
  onMessage,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging";

export type WebPushState =
  | { ok: true; token: string }
  | { ok: false; reason: string };

const SW_PATH = "/firebase-messaging-sw.js";
const SW_SCOPE = "/";

function isBrowser() {
  return typeof window !== "undefined" && typeof navigator !== "undefined";
}

async function getSessionUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

/** ✅ Safari hariç gerçek push desteği */
export function canWebPush(): boolean {
  const s = getWebPushSupport();
  return Boolean(s.supported);
}

export function getWebPushBlockReason(): string | null {
  const s = getWebPushSupport();
  return s.supported ? null : s.reason ?? "Web push desteklenmiyor.";
}

export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (!isBrowser()) return "default";
  if (!("Notification" in window)) return "denied";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isBrowser()) return "default";
  if (!("Notification" in window)) return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

/** ✅ SW register (idempotent) */
export async function registerWebPushSW(): Promise<ServiceWorkerRegistration | null> {
  if (!canWebPush()) return null;

  try {
    const existing = await navigator.serviceWorker.getRegistration(SW_SCOPE);
    if (existing) return existing;

    const reg = await navigator.serviceWorker.register(SW_PATH, { scope: SW_SCOPE });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (e) {
    console.error("SW register error:", e);
    return null;
  }
}

/**
 * ✅ push_tokens upsert (kolonlarınla %100 uyumlu)
 * onConflict: token (unique)
 */
export async function upsertPushTokenToDb(opts: {
  userId: string;
  token: string;
  enabled?: boolean;
  platform?: string; // "web"
  deviceId?: string | null;

  msgEnabled?: boolean;
  systemEnabled?: boolean;
  listingEnabled?: boolean;
}) {
  const now = new Date().toISOString();

  const payload: Record<string, any> = {
    user_id: opts.userId,
    token: opts.token,
    platform: opts.platform ?? "web",
    device_id: opts.deviceId ?? null,

    enabled: opts.enabled ?? true,
    msg_enabled: opts.msgEnabled ?? true,
    system_enabled: opts.systemEnabled ?? true,
    listing_enabled: opts.listingEnabled ?? true,

    last_seen_at: now,
    updated_at: now,
  };

  const { error } = await supabase
    .from("push_tokens")
    .upsert(payload, { onConflict: "token" });

  if (error) throw error;
}

/** ✅ kullanıcı için en güncel web row */
export async function getMyWebPushRow(): Promise<any | null> {
  const uid = await getSessionUserId();
  if (!uid) return null;

  const { data, error } = await supabase
    .from("push_tokens")
    .select(
      "id,user_id,token,platform,device_id,enabled,msg_enabled,system_enabled,listing_enabled,last_seen_at,created_at,updated_at"
    )
    .eq("user_id", uid)
    .eq("platform", "web")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

/** ✅ Web için FCM token üret */
export async function getFcmToken(): Promise<string | null> {
  if (!canWebPush()) return null;

  const vapidKey = getVapidKey();
  if (!vapidKey) return null;

  const perm = await getNotificationPermission();
  if (perm === "denied") return null;

  const finalPerm = perm === "default" ? await requestNotificationPermission() : perm;
  if (finalPerm !== "granted") return null;

  const reg = await registerWebPushSW();
  if (!reg) return null;

  const messaging = await getMessagingSafe();
  if (!messaging) return null;

  try {
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: reg,
    });
    return token || null;
  } catch (e) {
    console.error("getFcmToken error:", e);
    return null;
  }
}

/** ✅ Enable web push */
export async function enableWebPush(): Promise<WebPushState> {
  const uid = await getSessionUserId();
  if (!uid) return { ok: false, reason: "Oturum yok. Lütfen giriş yap." };

  const block = getWebPushBlockReason();
  if (block) return { ok: false, reason: block };

  const token = await getFcmToken();
  if (!token) return { ok: false, reason: "FCM token alınamadı (izin/SW/VAPID/Firebase kontrol)." };

  try {
    await upsertPushTokenToDb({
      userId: uid,
      token,
      platform: "web",
      enabled: true,
    });
    return { ok: true, token };
  } catch (e: any) {
    return { ok: false, reason: e?.message ?? "DB yazılamadı." };
  }
}

/** ✅ Disable web push */
export async function disableWebPush(): Promise<{ ok: boolean; reason?: string }> {
  if (!isBrowser()) return { ok: false, reason: "no-window" };

  const uid = await getSessionUserId();
  if (!uid) return { ok: false, reason: "no-session" };

  const messaging = await getMessagingSafe();

  try {
    const { error } = await supabase
      .from("push_tokens")
      .update({ enabled: false, updated_at: new Date().toISOString() })
      .eq("user_id", uid)
      .eq("platform", "web");

    if (error) throw error;

    if (messaging) {
      try {
        await deleteToken(messaging);
      } catch {}
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: e?.message ?? "Kapatılamadı" };
  }
}

/** ✅ Foreground listener */
export async function listenForegroundMessages(
  onPayload: (payload: MessagePayload) => void
): Promise<() => void> {
  const messaging: Messaging | null = await getMessagingSafe();
  if (!messaging) return () => {};

  const unsub = onMessage(messaging, (payload) => {
    try {
      onPayload(payload);
    } catch {}
  });

  return () => unsub();
}