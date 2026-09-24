import { NextRequest, NextResponse } from "next/server";
import { createEmbedding } from "@/lib/embedding";
import { db } from "@/lib/db";
function text(v: unknown) { return typeof v === "string" ? v.trim() : ""; }
function fail(e: unknown, s = 400) { return NextResponse.json({ error: e instanceof Error ? e.message : "AI action failed." }, { status: s }); }
export async function POST(request: NextRequest) {
  try {
    const b = await request.json();
    const action = text(b.action);
    const id = text(b.id);
    if (action === "promote-inbox") {
      const item = await db.inboxItem.findUnique({ where: { id } });
      if (!item) return fail(new Error("Inbox item not found."), 404);
      const entry = await db.knowledgeEntry.create({ data: { title: item.text.slice(0,80), type:"idea", topic:"Inbox", content:item.text, tags:"inbox", embedding:await createEmbedding(item.text) } });
      await db.inboxItem.update({ where:{id:item.id}, data:{status:"processed"} });
      return NextResponse.json({entry,inbox:item});
    }
    if (action === "create-task") {
      const title=text(b.title); if(!title) throw new Error("title is required.");
      const d=new Date(String(b.date ?? "")); if(Number.isNaN(d.getTime())) throw new Error("Invalid date.");
      const time=text(b.time)||"09:00"; if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("Invalid time.");
      const duration=Number(b.duration??30); if(!Number.isFinite(duration)||duration<1||duration>1440) throw new Error("Invalid duration.");
      const priority=text(b.priority)||"medium"; if(!["low","medium","high"].includes(priority)) throw new Error("Invalid priority.");
      const reminder=Number(b.reminderMinutes??10); if(!Number.isFinite(reminder)||reminder<0||reminder>1440) throw new Error("Invalid reminder.");
      return NextResponse.json(await db.task.create({data:{title,description:text(b.description)||null,date:d,time,duration,priority,status:"todo",project:text(b.project)||null,recurrence:["none","daily","weekly","monthly"].includes(text(b.recurrence))?text(b.recurrence):"none",reminderMinutes:reminder,timezone:text(b.timezone)||"UTC"}}));
    }
    if(action==="create-content"){const title=text(b.title);if(!title)throw new Error("title is required.");const format=text(b.format)||"post";if(!["carousel","video","article","post","newsletter"].includes(format))throw new Error("Invalid content format.");return NextResponse.json(await db.contentItem.create({data:{title,format,stage:"idea",body:text(b.body),sourceIdea:text(b.sourceIdea),researchId:text(b.researchId)||null}}));}
    if(action==="create-research"){const title=text(b.title);if(!title)throw new Error("title is required.");return NextResponse.json(await db.researchProject.create({data:{title,question:text(b.question),status:"idea"}}));}
    return fail(new Error("Unknown action."));
  } catch(e){return fail(e);}
}