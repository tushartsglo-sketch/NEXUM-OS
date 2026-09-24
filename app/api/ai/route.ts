import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

async function embed(input:string){
 if(!process.env.OPENAI_API_KEY)return null;
 const r=await fetch("https://api.openai.com/v1/embeddings",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+process.env.OPENAI_API_KEY},body:JSON.stringify({model:process.env.NEXUM_EMBEDDING_MODEL||"text-embedding-3-small",input})});
 if(!r.ok)return null; const d=await r.json(); return d.data?.[0]?.embedding as number[]|undefined;
}
function cosine(a:number[],b:number[]){let dot=0,aa=0,bb=0;for(let i=0;i<Math.min(a.length,b.length);i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i]}return dot/(Math.sqrt(aa)*Math.sqrt(bb)||1)}
export async function POST(request:NextRequest){
 try{
  const body=await request.json(); const question=typeof body.question==="string"?body.question.trim():""; if(!question)return NextResponse.json({error:"Question is required."},{status:400});
  const [knowledge,research,library,content,projects,tasks,journal,inbox]=await Promise.all([
   db.knowledgeEntry.findMany({orderBy:{updatedAt:"desc"},take:100}),db.researchProject.findMany({orderBy:{updatedAt:"desc"},take:100}),db.libraryFile.findMany({orderBy:{updatedAt:"desc"},take:100}),db.contentItem.findMany({orderBy:{updatedAt:"desc"},take:30}),db.project.findMany({orderBy:{updatedAt:"desc"},take:20}),db.task.findMany({orderBy:{updatedAt:"desc"},take:30}),db.journalEntry.findMany({orderBy:{date:"desc"},take:30}),db.inboxItem.findMany({orderBy:{createdAt:"desc"},take:30})
  ]);
  const vector=await embed(question);
  const candidates=[...knowledge.filter(x=>x.embedding).map(x=>({kind:"knowledge",title:x.title,text:x.content,embedding:x.embedding})),...research.filter(x=>x.embedding).map(x=>({kind:"research",title:x.title,text:x.question+" "+x.notes+" "+x.insights,embedding:x.embedding})),...library.filter(x=>x.embedding).map(x=>({kind:"library",title:x.name,text:x.description+" "+x.documentText,embedding:x.embedding}))];
  const selected=vector&&candidates.length?candidates.map(x=>({...x,score:cosine(vector,JSON.parse(x.embedding))})).sort((a,b)=>b.score-a.score).slice(0,20):[];
  const fallback=[...content.map(x=>({kind:"content",title:x.title,text:x.body+" "+x.sourceIdea})),...projects.map(x=>({kind:"project",title:x.name,text:x.description})),...tasks.map(x=>({kind:"task",title:x.title,text:(x.description||"")+" "+x.status+" "+x.priority})),...journal.map(x=>({kind:"journal",title:x.date.toISOString().slice(0,10),text:x.did+" "+x.learned+" "+x.mistakes+" "+x.next})),...inbox.map(x=>({kind:"inbox",title:x.createdAt.toISOString(),text:x.text}))];
  const records=(selected.length?selected:fallback).slice(0,30);
  if(!process.env.OPENAI_API_KEY)return NextResponse.json({configured:false,answer:"Semantic retrieval is ready, but OPENAI_API_KEY is not configured.",sources:records.map((x,i)=>({index:i+1,kind:x.kind,title:x.title,score:"score" in x?x.score:null}))});
  const context=records.map((x,i)=>"["+String(i+1)+"] "+x.kind.toUpperCase()+" — "+x.title+"\n"+x.text).join("\n\n");
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+process.env.OPENAI_API_KEY},body:JSON.stringify({model:process.env.NEXUM_AI_MODEL||"gpt-5-mini",instructions:"You are NEXUM Intelligence. Use the retrieved records as your evidence. Never invent memories. Cite relevant records as [1], [2], etc. Clearly distinguish evidence from inference. If evidence is insufficient, say so. Focus on synthesis, connections, patterns, unfinished work, and concrete next actions.",input:"RETRIEVED NEXUM MEMORY:\n"+context+"\n\nUSER QUESTION:\n"+question})});
  if(!response.ok)return NextResponse.json({error:"AI provider request failed."},{status:502});
  const data=await response.json();
  return NextResponse.json({configured:true,answer:data.output_text||"No answer returned.",sources:records.map((x,i)=>({index:i+1,kind:x.kind,title:x.title,score:"score" in x?x.score:null}))});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to process NEXUM Intelligence."},{status:500})}
}