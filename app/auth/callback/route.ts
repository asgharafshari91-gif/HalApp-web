// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function safeNext(next: string | null) {
  const v = (next || "/web").trim();
  if (!v.startsWith("/")) return "/web";
  if (v.startsWith("/auth")) return "/web";
  return v;
}

export async function GET(req: Request) {
  const urlObj = new URL(req.url);
  const next = safeNext(urlObj.searchParams.get("next"));
  const code = urlObj.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL(next, urlObj.origin));
  }

  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
          // bazı ortamlarda set engellenebilir; middleware tamamlar
        }
      },
    },
  });

  // ✅ code -> session cookie
  await supabase.auth.exchangeCodeForSession(code);

  return NextResponse.redirect(new URL(next, urlObj.origin));
}