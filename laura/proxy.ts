import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/session";

// Paths reachable without signing in: the public landing page, the login
// itself, and the two endpoints that already check their own secrets
// (Telegram's webhook secret header, Vercel Cron's CRON_SECRET).
const PUBLIC = new Set([
  "/",
  "/login",
  "/api/auth/login",
  "/api/auth/passkey/login",
  "/api/telegram/webhook",
  "/api/briefing/send",
  "/api/routine/send",
]);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC.has(pathname)) return NextResponse.next();
  if (isValidSession(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)"],
};
