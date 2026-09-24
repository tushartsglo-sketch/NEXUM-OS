import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  return NextResponse.json(await db.contentItem.findMany({ orderBy: { updatedAt: "desc" } }));
}
export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json(await db.contentItem.create({ data: { title: body.title, format: body.format || "post", stage: body.stage || "idea", body: body.body || "", sourceIdea: body.sourceIdea || "", researchId: body.researchId || null } }));
}
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json(await db.contentItem.update({ where: { id: body.id }, data: { title: body.title, format: body.format, stage: body.stage, body: body.body, sourceIdea: body.sourceIdea, researchId: body.researchId } }));
}