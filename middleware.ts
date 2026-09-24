import { NextRequest, NextResponse } from "next/server";
const PUBLIC_PATHS=["/api/health","/api/auth","/auth"];
export function middleware(request:NextRequest){
 const token=process.env.NEXUM_ACCESS_TOKEN;
 if(!token)return NextResponse.next();
 const path=request.nextUrl.pathname;
 if(PUBLIC_PATHS.some(x=>path.startsWith(x)))return NextResponse.next();
 if(path==="/api/notifications/dispatch" && process.env.NEXUM_CRON_SECRET && request.headers.get("x-nexum-cron-secret")===process.env.NEXUM_CRON_SECRET)return NextResponse.next();
 const supplied=request.cookies.get("nexum_access")?.value;
 if(supplied===token)return NextResponse.next();
 if(path.startsWith("/api/"))return NextResponse.json({error:"Unauthorized."},{status:401});
 const url=request.nextUrl.clone();url.pathname="/auth";url.searchParams.set("redirect",path);return NextResponse.redirect(url);
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js).*)"]};