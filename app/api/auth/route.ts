import { NextRequest, NextResponse } from "next/server";

function safeRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function GET(request: NextRequest) {
  const token = process.env.NEXUM_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "NEXUM_ACCESS_TOKEN is not configured." }, { status: 503 });

  const provided = request.headers.get("x-nexum-access-token");
  if (provided !== token) return NextResponse.json({ error: "Private NEXUM access required." }, { status: 401 });

  const redirect = safeRedirect(request.nextUrl.searchParams.get("redirect"));
  const response = NextResponse.redirect(new URL(redirect, request.url));
  response.cookies.set("nexum_access", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  return response;
}

export async function POST(request: NextRequest) {
  const token = process.env.NEXUM_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "NEXUM_ACCESS_TOKEN is not configured." }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  if (body.token !== token) return NextResponse.json({ error: "Private NEXUM access required." }, { status: 401 });

  const redirect = safeRedirect(typeof body.redirect === "string" ? body.redirect : null);
  const response = NextResponse.redirect(new URL(redirect, request.url));
  response.cookies.set("nexum_access", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  return response;
}
