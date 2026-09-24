import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json(await db.researchSource.create({ data: { title: body.title, url: body.url, notes: body.notes || "", projectId: body.projectId } }));
}