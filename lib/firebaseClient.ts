"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";

type FirebaseCfg = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

function readCfg(): FirebaseCfg | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId || !messagingSenderId || !appId) return null;

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined,
    messagingSenderId,
    appId,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
  };
}

export function hasFirebaseConfig(): boolean {
  return Boolean(readCfg());
}

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;

  const cfg = readCfg();
  if (!cfg) return null;

  try {
    return getApps().length ? getApp() : initializeApp(cfg);
  } catch {
    // init race vs hot reload vb.
    try {
      return getApp();
    } catch {
      return null;
    }
  }
}

/**
 * ✅ Messaging sadece destekli tarayıcılarda döner.
 * iOS Safari gibi yerlerde null dönebilir.
 */
export async function getMessagingSafe(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;

  const cfg = readCfg();
  if (!cfg) return null;

  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  const app = getFirebaseApp();
  if (!app) return null;

  try {
    return getMessaging(app);
  } catch {
    return null;
  }
}

export function getVapidKey(): string | null {
  const v = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  return v && v.trim().length ? v : null;
}