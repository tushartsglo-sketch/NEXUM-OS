import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() || "";
  if (!q) return NextResponse.json({knowledge:[],research:[],library:[],content:[],projects:[],tasks:[],journal:[],inbox:[]});
  const [knowledge,research,library,content,projects,tasks,journal,inbox] = await Promise.all([
    db.knowledgeEntry.findMany({where:{OR:[{title:{contains:q,mode:"insensitive"}},{content:{contains:q,mode:"insensitive"}},{topic:{contains:q,mode:"insensitive"}},{tags:{contains:q,mode:"insensitive"}}]},take:30}),
    db.researchProject.findMany({where:{OR:[{title:{contains:q,mode:"insensitive"}},{question:{contains:q,mode:"insensitive"}},{notes:{contains:q,mode:"insensitive"}},{insights:{contains:q,mode:"insensitive"}}]},take:30}),
    db.libraryFile.findMany({where:{OR:[{name:{contains:q,mode:"insensitive"}},{description:{contains:q,mode:"insensitive"}},{tags:{contains:q,mode:"insensitive"}},{documentText:{contains:q,mode:"insensitive"}}]},take:30}),
    db.contentItem.findMany({where:{OR:[{title:{contains:q,mode:"insensitive"}},{body:{contains:q,mode:"insensitive"}},{sourceIdea:{contains:q,mode:"insensitive"}}]},take:30}),
    db.project.findMany({where:{OR:[{name:{contains:q,mode:"insensitive"}},{description:{contains:q,mode:"insensitive"}}]},take:30}),
    db.task.findMany({where:{OR:[{title:{contains:q,mode:"insensitive"}},{description:{contains:q,mode:"insensitive"}},{project:{contains:q,mode:"insensitive"}}]},take:30}),
    db.journalEntry.findMany({where:{OR:[{did:{contains:q,mode:"insensitive"}},{learned:{contains:q,mode:"insensitive"}},{mistakes:{contains:q,mode:"insensitive"}},{next:{contains:q,mode:"insensitive"}}]},take:30}),
    db.inboxItem.findMany({where:{text:{contains:q,mode:"insensitive"}},take:30})
  ]);
  return NextResponse.json({knowledge,research,library,content,projects,tasks,journal,inbox});
}