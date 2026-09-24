import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function text(value: unknown, name: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(name + " is required.");
  return value.trim();
}
function fail(error: unknown) {
  return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed." }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const projectId = text(body.projectId, "projectId");
    const title = text(body.title, "title");
    const url = text(body.url, "url");
    new URL(url);
    const project = await db.researchProject.findUnique({ where: { id: projectId }, select: { id: true } });
    if (!project) return NextResponse.json({ error: "Research project not found." }, { status: 404 });
    return NextResponse.json(await db.researchSource.create({ data: { projectId, title, url, notes: body.notes || "" } }));
  } catch (error) {
    return fail(error);
  }
}