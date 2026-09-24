import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

async function embed(input:string){
  if(!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured.");
  const r=await fetch("https://api.openai.com/v1/embeddings",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+process.env.OPENAI_API_KEY},body:JSON.stringify({model:process.env.NEXUM_EMBEDDING_MODEL||"text-embedding-3-small",input})});
  if(!r.ok) throw new Error("Embedding provider request failed.");
  const d=await r.json(); return JSON.stringify(d.data[0].embedding);
}
export async function POST(request:NextRequest){
 try{
  const b=await request.json(); const kind=b.kind; const id=b.id;
  if(!kind||!id)return NextResponse.json({error:"kind and id are required."},{status:400});
  let text="";
  if(kind==="knowledge"){const x=await db.knowledgeEntry.findUnique({where:{id}});if(!x)throw new Error("Record not found.");text=x.title+"\n"+x.topic+"\n"+x.tags+"\n"+x.content;await db.knowledgeEntry.update({where:{id},data:{embedding:await embed(text)}})}
  else if(kind==="research"){const x=await db.researchProject.findUnique({where:{id}});if(!x)throw new Error("Record not found.");text=x.title+"\n"+x.question+"\n"+x.notes+"\n"+x.insights;await db.researchProject.update({where:{id},data:{embedding:await embed(text)}})}
  else if(kind==="library"){const x=await db.libraryFile.findUnique({where:{id}});if(!x)throw new Error("Record not found.");text=x.name+"\n"+x.description+"\n"+x.tags+"\n"+x.documentText;await db.libraryFile.update({where:{id},data:{embedding:await embed(text)}})}
  else return NextResponse.json({error:"Unsupported kind."},{status:400});
  return NextResponse.json({indexed:true});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to create embedding."},{status:500});}
}