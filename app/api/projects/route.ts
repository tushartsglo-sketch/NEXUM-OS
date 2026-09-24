import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  return NextResponse.json(await db.project.findMany({ orderBy: { updatedAt: "desc" } }));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json(await db.project.create({ data: { name: body.name, description: body.description || "" } }));
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json(await db.project.update({ where: { id: body.id }, data: { progress: Number(body.progress), status: body.status } }));
}