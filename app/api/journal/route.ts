import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  return NextResponse.json(await db.journalEntry.findMany({ orderBy: { date: "desc" } }));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json(await db.journalEntry.upsert({
    where: { date: new Date(body.date) },
    update: { did: body.did || "", learned: body.learned || "", mistakes: body.mistakes || "", next: body.next || "" },
    create: { date: new Date(body.date), did: body.did || "", learned: body.learned || "", mistakes: body.mistakes || "", next: body.next || "" }
  }));
}