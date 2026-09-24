import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { classifyCommand } from "@/lib/command-intent";


async function commandEmbedding(input:string){ if(!process.env.OPENAI_API_KEY) return null; const r=await fetch("https://api.openai.com/v1/embeddings",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+process.env.OPENAI_API_KEY},body:JSON.stringify({model:process.env.NEXUM_EMBEDDING_MODEL||"text-embedding-3-small",input})}); if(!r.ok)return null; const d=await r.json(); return d.data?.[0]?.embedding||null; }
function cosine(a:number[],b:number[]){let dot=0,aa=0,bb=0;for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i]}return dot/(Math.sqrt(aa)*Math.sqrt(bb)||1); }

function text(v: unknown) { return typeof v === "string" ? v.trim() : ""; }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const command = text(body.command);
    if (!command) return NextResponse.json({ error: "Command is required." }, { status: 400 });

    const lower = command.toLowerCase();
    const confirm = body.confirm === true;
    if (confirm && body.task && typeof body.task === "object" && typeof body.task.title !== "undefined") {
      const task = body.task as { date?: string; time?: string; recurrence?: string; priority?: string; reminderMinutes?: number };
      const date = task.date ? new Date(task.date + "T00:00:00") : new Date();
      if (Number.isNaN(date.getTime())) return NextResponse.json({ error: "Invalid task date." }, { status: 400 });
      const time = typeof task.time === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(task.time) ? task.time : "09:00";
      const recurrenceValue = task.recurrence || "none";
      const recurrence = ["none", "daily", "weekly", "monthly"].includes(recurrenceValue) ? recurrenceValue : recurrenceValue === "weekday" ? "weekly" : "none";
      const priority = ["low", "medium", "high"].includes(task.priority || "") ? task.priority || "medium" : "medium";
      const reminderMinutes = Number.isInteger(task.reminderMinutes) && task.reminderMinutes >= 0 && task.reminderMinutes <= 1440 ? task.reminderMinutes : 0;
      const title = command.replace(/^(?:remind me|task)\s+/i, "").trim() || command;
      const item = await db.task.create({ data: { title, date, time, duration: 30, status: "todo", priority, recurrence, reminderMinutes } });
      return NextResponse.json({ type: "created", kind: "task", item, parser: "ai-intent" });
    }
    const interpreted = !confirm && !/^(?:remind me|task)\\s+/i.test(command) && !/^(?:task|note|research):/i.test(command)
      ? await classifyCommand(command)
      : null;
    if (interpreted && interpreted.confidence >= 0.85) {
      if (interpreted.intent === "note") {
        const entry = await db.knowledgeEntry.create({ data: { title: interpreted.text.slice(0, 80), type: "note", topic: "General", content: interpreted.text, tags: "" } });
        return NextResponse.json({ type: "created", kind: "knowledge", item: entry, parser: "ai-intent" });
      }
      if (interpreted.intent === "research") {
        const item = await db.researchProject.create({ data: { title: interpreted.text.slice(0, 100), question: interpreted.text, status: "idea" } });
        return NextResponse.json({ type: "created", kind: "research", item, parser: "ai-intent" });
      }
      if (interpreted.intent === "task") {
        return NextResponse.json({
          type: "confirmation_required",
          kind: "task",
          title: interpreted.text,
          command,
          schedule: [interpreted.date, interpreted.time, interpreted.recurrence !== "none" ? "every " + interpreted.recurrence : "", interpreted.priority !== "medium" ? interpreted.priority + " priority" : "", interpreted.reminderMinutes ? interpreted.reminderMinutes + " min reminder" : ""].filter(Boolean).join(" · ") || "AI interpreted this as a task.",
          task: { date: interpreted.date, time: interpreted.time, recurrence: interpreted.recurrence, priority: interpreted.priority, reminderMinutes: interpreted.reminderMinutes }
        });
      }
    }
    const confirm = body.confirm === true;
    if (!confirm && /^(?:remind me|task)\s+/i.test(command)) {
      const recurringPreview = command.match(/^(?:remind me|task)\s+(.+?)\s+every\s+(day|daily|week|weekly|month|monthly|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+at\s+(\d{1,2})(?::(\d{2}))?)?/i);
      const relativePreview = command.match(/^(?:remind me|task)\s+(.+?)\s+(tomorrow|today|in\s+\d+\s+(?:hour|hours|minute|minutes)|next\s+\w+)\s*(?:at\s+(\d{1,2})(?::(\d{2}))?)?/i);
      if (recurringPreview || relativePreview) {
        const match = recurringPreview || relativePreview;
        return NextResponse.json({ type: "confirmation_required", kind: "task", title: match?.[1]?.trim(), command, schedule: recurringPreview ? "every " + recurringPreview[2] + (recurringPreview[3] ? " at " + recurringPreview[3] + ":" + (recurringPreview[4] || "00") : "") : (relativePreview?.[2] || "") + (relativePreview?.[3] ? " at " + relativePreview[3] + ":" + (relativePreview[4] || "00") : "") });
      }
    }
    const relativeTask = command.match(/^(?:remind me|task)\s+(.+?)\s+(tomorrow|today|in\s+\d+\s+(?:hour|hours|minute|minutes)|next\s+\w+)\s*(?:at\s+(\d{1,2})(?::(\d{2}))?)?\s*$/i);
    const recurringMatch = command.match(/^(?:remind me|task)\s+(.+?)\s+every\s+(day|daily|week|weekly|month|monthly|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+at\s+(\d{1,2})(?::(\d{2}))?)?\s*$/i);
    if (recurringMatch) {
      const rule=recurringMatch[2].toLowerCase(); const recurrence=["day","daily"].includes(rule)?"daily":["week","weekly"].includes(rule)?"weekly":["month","monthly"].includes(rule)?"monthly":"weekly";
      const date=new Date(); const days=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"]; if(days.includes(rule)){const delta=(days.indexOf(rule)-date.getDay()+7)%7; date.setDate(date.getDate()+(delta||7));}
      if(recurringMatch[3]) date.setHours(Number(recurringMatch[3]),Number(recurringMatch[4]||0),0,0);
      const reminderMatch=recurringMatch[1].match(/^(.*?)(?:\s+remind(?:er)?\s+(?:me\s+)?(?:at\s+the\s+exact\s+time|exactly|0\s+minutes?|30\s+minutes?|1\s+hour|60\s+minutes?)?\s+before)?$/i); const title=(reminderMatch?.[1]||recurringMatch[1]).trim(); const reminderText=recurringMatch[1].match(/(at\s+the\s+exact\s+time|exactly|0\s+minutes?|30\s+minutes?|1\s+hour|60\s+minutes?)\s+before/i)?.[1]?.toLowerCase()||""; const reminderMinutes=reminderText.includes("30")?30:(reminderText.includes("1 hour")||reminderText.includes("60")?60:0); const task=await db.task.create({data:{title,date,time:date.toTimeString().slice(0,5),duration:30,status:"todo",priority:"medium",recurrence,reminderMinutes}}); return NextResponse.json({type:"created",kind:"task",item:task,parser:"recurring-task"});
    }
    if (relativeTask) {
      const phrase=relativeTask[2].toLowerCase(), date=new Date();
      if (phrase==="tomorrow") date.setDate(date.getDate()+1);
      else if (phrase==="today") {}
      else if (/^in\s+\d+\s+hour/.test(phrase)) date.setHours(date.getHours()+Number(phrase.match(/\d+/)?.[0]||0));
      else if (/^in\s+\d+\s+minute/.test(phrase)) date.setMinutes(date.getMinutes()+Number(phrase.match(/\d+/)?.[0]||0));
      else if (/^next\s+/.test(phrase)) { const names=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"], target=names.indexOf(phrase.replace("next ","")); if(target>=0){let delta=(target-date.getDay()+7)%7||7;date.setDate(date.getDate()+delta);} }
      if (relativeTask[3]) date.setHours(Number(relativeTask[3]),Number(relativeTask[4]||0),0,0);
      const reminderText=command.match(/(30\s+minutes?|1\s+hour|60\s+minutes?|exact(?:ly)?|at\s+the\s+exact\s+time)\s+before/i)?.[1]?.toLowerCase()||""; const reminderMinutes=reminderText.includes("30")?30:(reminderText.includes("1 hour")||reminderText.includes("60")?60:0); const task=await db.task.create({data:{title:relativeTask[1].trim(),date,time:date.toTimeString().slice(0,5),duration:30,status:"todo",priority:"medium",reminderMinutes}});
      return NextResponse.json({type:"created",kind:"task",item:task,parser:"relative-task"});
    }
    if (lower.startsWith("task:")) {
      const title = command.slice(5).trim();
      if (!title) return NextResponse.json({ error: "Task title is required." }, { status: 400 });
      const task = await db.task.create({ data: { title, date: new Date(), time: "09:00", duration: 30, status: "todo", priority: "medium" } });
      return NextResponse.json({ type: "created", kind: "task", item: task });
    }

    if (lower.startsWith("note:")) {
      const title = command.slice(5).trim();
      if (!title) return NextResponse.json({ error: "Note text is required." }, { status: 400 });
      const entry = await db.knowledgeEntry.create({ data: { title: title.slice(0, 80), type: "note", topic: "General", content: title, tags: "" } });
      return NextResponse.json({ type: "created", kind: "knowledge", item: entry });
    }

    if (lower.startsWith("research:")) {
      const question = command.slice(9).trim();
      if (!question) return NextResponse.json({ error: "Research question is required." }, { status: 400 });
      const item = await db.researchProject.create({ data: { title: question.slice(0, 100), question, status: "idea" } });
      return NextResponse.json({ type: "created", kind: "research", item });
    }

    const q = command.replace(/^(find|search|show)\s+/i, "").trim() || command;
    const [knowledge, research, content] = await Promise.all([
      db.knowledgeEntry.findMany({ where: { OR: [{ title: { contains: q, mode: "insensitive" } }, { content: { contains: q, mode: "insensitive" } }, { topic: { contains: q, mode: "insensitive" } }] }, take: 8 }),
      db.researchProject.findMany({ where: { OR: [{ title: { contains: q, mode: "insensitive" } }, { question: { contains: q, mode: "insensitive" } }, { notes: { contains: q, mode: "insensitive" } }] }, take: 8 }),
      db.contentItem.findMany({ where: { OR: [{ title: { contains: q, mode: "insensitive" } }, { body: { contains: q, mode: "insensitive" } }, { sourceIdea: { contains: q, mode: "insensitive" } }] }, take: 8 })
    ]);
    return NextResponse.json({ type: "search", query: q, results: [
      ...knowledge.map(x => ({ kind: "knowledge", id: x.id, title: x.title, preview: x.content.slice(0, 220) })),
      ...research.map(x => ({ kind: "research", id: x.id, title: x.title, preview: x.question.slice(0, 220) })),
      ...content.map(x => ({ kind: "content", id: x.id, title: x.title, preview: x.sourceIdea.slice(0, 220) }))
    ]});
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Command failed." }, { status: 400 });
  }
}
