import { createEmbedding } from "@/lib/embedding";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");
  if (type === "tasks") return NextResponse.json(await db.task.findMany({ orderBy: [{ date: "asc" }, { time: "asc" }] }));
  if (type === "knowledge") return NextResponse.json(await db.knowledgeEntry.findMany({ orderBy: { updatedAt: "desc" } }));
  if (type === "projects") return NextResponse.json(await db.project.findMany({ orderBy: { updatedAt: "desc" } }));
  if (type === "journal") return NextResponse.json(await db.journalEntry.findMany({ orderBy: { date: "desc" } }));
  if (type === "inbox") return NextResponse.json(await db.inboxItem.findMany({ orderBy: { createdAt: "desc" } }));
  return NextResponse.json({ error: "Unknown data type." }, { status: 400 });
}

function requiredString(value: unknown, name: string) { if (typeof value !== "string" || !value.trim()) throw new Error(name + " is required."); return value.trim(); }
function safeNumber(value: unknown, fallback: number, min: number, max: number) { const n=Number(value); if (!Number.isFinite(n) || n<min || n>max) throw new Error("Invalid numeric value."); return n || fallback; }

export async function POST(request: NextRequest) {
  const body = await request.json();
  const type = body.type;
  if (type === "inbox") return NextResponse.json(await db.inboxItem.create({ data: { text: requiredString(body.text, "text") } }));
  if (type === "knowledge") { const created = await db.knowledgeEntry.create({ data: { title: requiredString(body.title, "title"), type: body.entryType || "note", topic: body.topic || "General", tags: body.tags || "", content: body.content || "", embedding: await createEmbedding(body.title + "\n" + (body.topic || "") + "\n" + (body.tags || "") + "\n" + (body.content || "")) } }); return NextResponse.json(created); }
  if (type === "project") return NextResponse.json(await db.project.create({ data: { name: requiredString(body.name, "name"), description: body.description || "" } }));
  if (type === "journal") return NextResponse.json(await db.journalEntry.upsert({ where: { date: new Date(body.date) }, update: { did: body.did || "", learned: body.learned || "", mistakes: body.mistakes || "", next: body.next || "" }, create: { date: new Date(body.date), did: body.did || "", learned: body.learned || "", mistakes: body.mistakes || "", next: body.next || "" } }));
  if (type === "task") return NextResponse.json(await db.task.create({ data: { title: requiredString(body.title, "title"), description: body.description || null, date: new Date(body.date), time: body.time || "09:00", duration: Number(body.duration || 30), priority: body.priority || "medium", project: body.project || null, recurrence: body.recurrence || "none", reminderMinutes: Number(body.reminderMinutes ?? 10) } }));
  return NextResponse.json({ error: "Unknown data type." }, { status: 400 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  if (body.type === "task") return NextResponse.json(await db.task.update({ where: { id: body.id }, data: { status: body.status, ...(body.title !== undefined ? {title: body.title} : {}), ...(body.description !== undefined ? {description: body.description} : {}), ...(body.date !== undefined ? {date: new Date(body.date)} : {}), ...(body.time !== undefined ? {time: body.time} : {}), ...(body.duration !== undefined ? {duration: Number(body.duration)} : {}), ...(body.priority !== undefined ? {priority: body.priority} : {}), ...(body.project !== undefined ? {project: body.project || null} : {}), ...(body.recurrence !== undefined ? {recurrence: body.recurrence} : {}), ...(body.reminderMinutes !== undefined ? {reminderMinutes: Number(body.reminderMinutes)} : {}) } }));
  if (body.type === "inbox") return NextResponse.json(await db.inboxItem.update({ where: { id: body.id }, data: { status: body.status } }));
  if (body.type === "project") return NextResponse.json(await db.project.update({ where: { id: body.id }, data: { progress: Number(body.progress), status: body.status } }));
  if (body.type === "knowledge") { const updated = await db.knowledgeEntry.update({ where: { id: body.id }, data: { title: body.title, type: body.entryType, topic: body.topic, tags: body.tags, content: body.content, embedding: await createEmbedding((body.title||"")+"\\n"+(body.topic||"")+"\\n"+(body.tags||"")+"\\n"+(body.content||"")) } }); return NextResponse.json(updated); }
  return NextResponse.json({ error: "Unknown data type." }, { status: 400 });
}