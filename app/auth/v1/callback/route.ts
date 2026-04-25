import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const source = new URL(request.url);
  const target = new URL("/auth/callback", source.origin);

  source.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value);
  });

  return NextResponse.redirect(target);
}
