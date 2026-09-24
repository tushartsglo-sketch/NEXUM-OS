import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

async function embed(input:string){
 if(!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured.");
 const r=await fetch("https://api.openai.com/v1/embeddings",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+process.env.OPENAI_API_KEY},body:JSON.stringify({model:process.env.NEXUM_EMBEDDING_MODEL||"text-embedding-3-small",input})});
 if(!r.ok) throw new Error("Embedding provider request failed.");
 const d=await r.json(); return d.data[0].embedding as number[];
}
function cosine(a:number[],b:number[]){let dot=0,aa=0,bb=0;for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i]}return dot/(Math.sqrt(aa)*Math.sqrt(bb)||1)}
export async function GET(request:NextRequest){
 try{
  const q=new URL(request.url).searchParams.get("q")?.trim()||"";
  const semantic=new URL(request.url).searchParams.get("semantic")==="1";
  if(!q)return NextResponse.json({results:[]});
  if(!semantic){
   const rows=await db.knowledgeEntry.findMany({where:{OR:[{title:{contains:q,mode:"insensitive"}},{content:{contains:q,mode:"insensitive"}},{topic:{contains:q,mode:"insensitive"}},{tags:{contains:q,mode:"insensitive"}}]},take:30});
   return NextResponse.json({results:rows.map(x=>({kind:"knowledge",id:x.id,title:x.title,score:1,preview:x.content.slice(0,240)}))});
  }
  const vector=await embed(q);
  const [knowledge,research,library]=await Promise.all([
   db.knowledgeEntry.findMany({where:{NOT:{embedding:""}}}),
   db.researchProject.findMany({where:{NOT:{embedding:""}}}),
   db.libraryFile.findMany({where:{NOT:{embedding:""}}})
  ]);
  const results=[
   ...knowledge.map(x=>({kind:"knowledge",id:x.id,title:x.title,text:x.content,embedding:x.embedding})),
   ...research.map(x=>({kind:"research",id:x.id,title:x.title,text:x.question+" "+x.notes+" "+x.insights,embedding:x.embedding})),
   ...library.map(x=>({kind:"library",id:x.id,title:x.name,text:x.description+" "+x.documentText,embedding:x.embedding}))
  ].map(x=>({...x,score:cosine(vector,JSON.parse(x.embedding))})).sort((a,b)=>b.score-a.score).slice(0,20);
  return NextResponse.json({results:results.map(({embedding,...x})=>({...x,preview:x.text.slice(0,300)}))});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Semantic search failed."},{status:500})}
}