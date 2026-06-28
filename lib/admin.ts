// lib/admin.ts
import "server-only";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

export type AdminGuard =
  | { ok: true; uid: string }
  | { ok: false; redirectTo: string; reason?: string };

function encNext(path: string) {
  return encodeURIComponent(path);
}

/**
 * ✅ Next.js 16 uyumlu cookie-session Supabase client
 * Sadece auth/admin kontrolü için kullanılır.
 */
async function sbServer() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error(
      "ENV eksik: NEXT_PUBLIC_SUPABASE_URL veya NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component içinde cookie set engellenebilir.
        }
      },
    },
  });
}

/**
 * ✅ Service Role client
 * Sadece server-side admin işlemlerinde kullanılır.
 * Browser'a asla gönderilmez.
 */
export function serviceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "ENV eksik: NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * ✅ Admin kontrolü
 * Kullanıcı cookie session ile doğrulanır.
 * profiles.is_admin true değilse admin alanına girmez.
 */
export async function requireAdminOrRedirect(
  nextPath = "/admin"
): Promise<AdminGuard> {
  const sb = await sbServer();

  const { data: u, error: ue } = await sb.auth.getUser();
  const user = u?.user ?? null;

  if (ue || !user) {
    return {
      ok: false,
      redirectTo: `/auth?next=${encNext(nextPath)}`,
      reason: "not_authed",
    };
  }

  const uid = user.id;

  const { data: p, error: pe } = await sb
    .from("profiles")
    .select("id,is_admin")
    .eq("id", uid)
    .maybeSingle();

  if (pe) {
    return {
      ok: false,
      redirectTo: "/",
      reason: "profile_read_failed",
    };
  }

  const isAdmin = Boolean((p as any)?.is_admin);

  if (!isAdmin) {
    return {
      ok: false,
      redirectTo: "/",
      reason: "not_admin",
    };
  }

  return {
    ok: true,
    uid,
  };
}

/**
 * ✅ Direkt redirect eden admin guard
 */
export async function mustBeAdmin(nextPath = "/admin") {
  const g = await requireAdminOrRedirect(nextPath);

  if (!g.ok) {
    redirect(g.redirectTo);
  }

  return g;
}

/**
 * ✅ Admin DB işlemleri için client
 *
 * Önemli:
 * - Yetki kontrolü önce requireAdminOrRedirect ile yapılmalı.
 * - Bu client service role kullanır.
 * - RLS'e takılmaz.
 */
export async function adminServerClient() {
  return serviceRoleClient();
}

/**
 * ✅ Normal session client alias
 * Eski dosyalar bozulmasın diye bırakıldı.
 * Kullanıcı oturumuna göre çalışır.
 */
export async function supabaseServer() {
  return sbServer();
}

/**
 * ✅ Normal session client alias
 */
export async function supabaseServerClient() {
  return sbServer();
}