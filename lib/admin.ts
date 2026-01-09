// lib/admin.ts
import "server-only";

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
 * ✅ Next.js 16 (Turbopack) uyumlu server-side Supabase client (cookie session ile)
 */
async function sbServer() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
        // Server Component / Route Handler farklarında set bazen engellenebilir
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // noop
        }
      },
    },
  });
}

/**
 * ✅ Admin kontrolü yapar, redirect path döndürür.
 * Kullanım:
 *   const g = await requireAdminOrRedirect("/admin/users");
 *   if (!g.ok) redirect(g.redirectTo);
 */
export async function requireAdminOrRedirect(
  nextPath = "/admin"
): Promise<AdminGuard> {
  const sb = await sbServer();

  // 1) Auth kontrol
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

  // 2) profiles.is_admin kontrol (RLS doğruysa çalışır)
  const { data: p, error: pe } = await sb
    .from("profiles")
    .select("id,is_admin")
    .eq("id", uid)
    .maybeSingle();

  if (pe) {
    return { ok: false, redirectTo: "/", reason: "profile_read_failed" };
  }

  const isAdmin = Boolean((p as any)?.is_admin);
  if (!isAdmin) {
    return { ok: false, redirectTo: "/", reason: "not_admin" };
  }

  return { ok: true, uid };
}

/**
 * ✅ Direkt redirect eden helper
 */
export async function mustBeAdmin(nextPath = "/admin") {
  const g = await requireAdminOrRedirect(nextPath);
  if (!g.ok) redirect(g.redirectTo);
  return g;
}

/**
 * ✅ Admin işlemleri için server client
 */
export async function adminServerClient() {
  return sbServer();
}

/**
 * ✅ Alias (eski import'ların bozulmaması için)
 * Bazı dosyalarda `supabaseServer()` adı kullanılmış olabilir.
 */
export async function supabaseServer() {
  return sbServer();
}

/**
 * ✅ İstersen ekstra alias daha (bazı projelerde kullanılıyor)
 */
export async function supabaseServerClient() {
  return sbServer();
}