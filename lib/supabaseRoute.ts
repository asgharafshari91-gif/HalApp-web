// lib/supabaseRoute.ts
import { cookies } from "next/headers";
import { createServerClient as createSsrServerClient } from "@supabase/ssr";

// ✅ Senin mevcut stilin: async route client
export async function supabaseRouteClient() {
  // Next sürümüne göre cookies() sync/async davranabiliyor; await güvenli
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createSsrServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Route handler'da bazen set izni olmayabiliyor → sorun değil
        }
      },
    },
  });
}

/**
 * ✅ Backward-compatible export:
 * Bazı dosyaların `import { createServerClient } from "@/lib/supabaseRoute"` bekliyor.
 * Bu wrapper aynı işi yapar ve hatayı %100 bitirir.
 */
export function createServerClient() {
  // async fonksiyonu sync export ile döndürür (route.ts içinde await ile kullanırsın)
  return supabaseRouteClient();
}