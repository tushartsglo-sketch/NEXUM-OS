import { createEmbedding } from "@/lib/embedding";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  return NextResponse.json(await db.researchProject.findMany({ include: { sources: true }, orderBy: { updatedAt: "desc" } }));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const created = await db.researchProject.create({
    data: { title: body.title, question: body.question || "", status: body.status || "idea", notes: body.notes || "", insights: body.insights || "" },
    include: { sources: true }
  });
  if (process.env.OPENAI_API_KEY) await db.researchProject.update({ where: { id: created.id }, data: { embedding: await createEmbedding(created.title + "\n" + created.question + "\n" + created.notes + "\n" + created.insights) } });
  return NextResponse.json(created);
}

export async function DELETE(request: NextRequest) { const {id}=await request.json(); if(!id)return NextResponse.json({error:"id is required."},{status:400}); await db.researchProject.delete({where:{id}}); return NextResponse.json({deleted:true}); }

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const current = await db.researchProject.findUnique({ where: { id: body.id } });
  if (!current) return NextResponse.json({ error: "Research record not found." }, { status: 404 });
  const updated = await db.researchProject.update({
    where: { id: body.id },
    data: { status: body.status, notes: body.notes, insights: body.insights },
    include: { sources: true }
  });
  if (process.env.OPENAI_API_KEY) await db.researchProject.update({ where: { id: updated.id }, data: { embedding: await createEmbedding(updated.title + "\n" + updated.question + "\n" + (updated.notes || "") + "\n" + (updated.insights || "")) } });
  return NextResponse.json(updated);
}

export async function POST_SOURCE(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json(await db.researchSource.create({ data: { title: body.title, url: body.url, notes: body.notes || "", projectId: body.projectId } }));
}