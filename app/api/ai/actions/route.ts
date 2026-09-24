import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const action = body.action;
  if (action === "promote-inbox") {
    const item = await db.inboxItem.findUnique({ where: { id: body.id } });
    if (!item) return NextResponse.json({ error: "Inbox item not found." }, { status: 404 });
    const entry = await db.knowledgeEntry.create({ data: { title: item.text.slice(0, 80), type: "idea", topic: "Inbox", content: item.text, tags: "inbox" } });
    await db.inboxItem.update({ where: { id: item.id }, data: { status: "processed" } });
    return NextResponse.json({ entry, inbox: item });
  }
  if (action === "create-task") {
    const task = await db.task.create({ data: { title: body.title, description: body.description || null, date: body.date ? new Date(body.date) : new Date(), time: body.time || "09:00", duration: body.duration || 30, priority: body.priority || "medium", status: "todo", project: body.project || null } });
    return NextResponse.json(task);
  }
  if (action === "create-content") {
    const item = await db.contentItem.create({ data: { title: body.title, format: body.format || "post", stage: "idea", body: body.body || "", sourceIdea: body.sourceIdea || "", researchId: body.researchId || null } });
    return NextResponse.json(item);
  }
  if (action === "create-research") {
    const item = await db.researchProject.create({ data: { title: body.title, question: body.question || "", status: "idea" } });
    return NextResponse.json(item);
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}