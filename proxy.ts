import { type NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/signup", "/"];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow auth callback routes to complete.
  if (pathname.startsWith("/auth")) {
    return NextResponse.next();
  }

  // Allow public routes.
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow API routes.
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Client-side AuthProvider handles route guards after hydration.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
