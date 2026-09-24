import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

async function embed(input:string){
 if(!process.env.OPENAI_API_KEY) return null;
 const r=await fetch("https://api.openai.com/v1/embeddings",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+process.env.OPENAI_API_KEY},body:JSON.stringify({model:process.env.NEXUM_EMBEDDING_MODEL||"text-embedding-3-small",input})});
 if(!r.ok) return null;
 const d=await r.json(); return d.data?.[0]?.embedding as number[]|undefined;
}
function cosine(a:number[],b:number[]){let dot=0,aa=0,bb=0;for(let i=0;i<Math.min(a.length,b.length);i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i]}return dot/(Math.sqrt(aa)*Math.sqrt(bb)||1)}
export async function POST(request:NextRequest){
 try{
  const {question}=await request.json(); if(typeof question!=="string"||!question.trim()) return NextResponse.json({error:"Question is required."},{status:400});
  const [knowledge,research,library]=await Promise.all([db.knowledgeEntry.findMany({take:100}),db.researchProject.findMany({take:100}),db.libraryFile.findMany({take:100})]);
  const vector=await embed(question);
  const candidates=[...knowledge.filter(x=>x.embedding).map(x=>({kind:"knowledge",title:x.title,text:x.content,embedding:x.embedding})),...research.filter(x=>x.embedding).map(x=>({kind:"research",title:x.title,text:x.question+" "+x.notes+" "+x.insights,embedding:x.embedding})),...library.filter(x=>x.embedding).map(x=>({kind:"library",title:x.name,text:x.description+" "+x.documentText,embedding:x.embedding}))];
  const selected=vector&&candidates.length?candidates.map(x=>({...x,score:cosine(vector,JSON.parse(x.embedding))})).sort((a,b)=>b.score-a.score).slice(0,20):candidates.slice(0,20);
  return NextResponse.json({question,retrieved:selected.map(x=>({kind:x.kind,title:x.title,text:x.text,score:"score" in x?x.score:null}))});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Retrieval failed."},{status:500})}
}