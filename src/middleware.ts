import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — this is the critical line
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const publicPaths = ["/login", "/register", "/logout"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  // Unauthenticated + protected route → login
  if (!user && !isPublic && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Authenticated + hitting login/register → their dashboard
  if (user && (pathname === "/login" || pathname === "/register")) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "volunteer") {
      // Check if volunteer has selected an NGO
      const { data: vol } = await supabase
        .from("volunteers")
        .select("ngo_id")
        .eq("id", user.id)
        .single();

      if (!vol?.ngo_id) {
        return NextResponse.redirect(new URL("/volunteer/select-ngo", request.url));
      }
    }

    const destinations: Record<string, string> = {
      donor:     "/donor/dashboard",
      ngo:       "/ngo/map",
      volunteer: "/volunteer/tasks",
      admin:     "/admin/kyc",
    };

    if (profile?.role) {
      return NextResponse.redirect(
        new URL(destinations[profile.role], request.url)
      );
    }
  }

  // Volunteer onboarding guard: if they haven't selected an NGO yet,
  // redirect them to the selection page (unless they're already there)
  if (user && pathname.startsWith("/volunteer") && pathname !== "/volunteer/select-ngo") {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "volunteer") {
      const { data: vol } = await supabase
        .from("volunteers")
        .select("ngo_id")
        .eq("id", user.id)
        .single();

      if (!vol?.ngo_id) {
        return NextResponse.redirect(new URL("/volunteer/select-ngo", request.url));
      }
    }
  }

  // NGO pending guard: force pending NGOs to the KYC submission page
  if (user && pathname.startsWith("/ngo") && pathname !== "/ngo/kyc") {
    const { data: profile } = await supabase
      .from("users")
      .select("status, role")
      .eq("id", user.id)
      .single();
    
    if (profile?.role === "ngo" && profile?.status === "pending") {
      return NextResponse.redirect(new URL("/ngo/kyc", request.url));
    }
  }
  // Admin role guard: only admin users can access /admin/* routes
  if (user && pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      const destinations: Record<string, string> = {
        donor:     "/donor/dashboard",
        ngo:       "/ngo/map",
        volunteer: "/volunteer/tasks",
      };
      const dest = destinations[profile?.role ?? ""] ?? "/login";
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};