import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [tasks, knowledge, projects, journal, inbox] = await Promise.all([
    db.task.findMany({ orderBy: [{ date: "asc" }, { time: "asc" }] }),
    db.knowledgeEntry.findMany({ orderBy: { createdAt: "desc" } }),
    db.project.findMany({ orderBy: { updatedAt: "desc" } }),
    db.journalEntry.findMany({ orderBy: { date: "desc" }, take: 30 }),
    db.inboxItem.findMany({ orderBy: { createdAt: "desc" }, take: 50 })
  ]);
  return NextResponse.json({ tasks, knowledge, projects, journal, inbox });
}
