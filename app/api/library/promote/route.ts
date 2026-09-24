import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createEmbedding } from "@/lib/embedding";
function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }

export async function POST(request:NextRequest){
 try {
 const body=await request.json();
 const libraryFileId=typeof body.libraryFileId==="string"?body.libraryFileId.trim():"";
 const kind=typeof body.kind==="string"?body.kind.trim():"";
 const text=typeof body.text==="string"?body.text.trim():"";
 if(!libraryFileId||!kind||!text)return NextResponse.json({error:"libraryFileId, kind and text are required."},{status:400});
 const file=await db.libraryFile.findUnique({where:{id:libraryFileId}});
 if(!file)return NextResponse.json({error:"Library file not found."},{status:404});
 if(kind!=="research" && kind!=="content") return NextResponse.json({error:"Unsupported promotion type."},{status:400});
 if(kind==="research"){
  const item=await db.researchProject.create({data:{title:text.slice(0,120),question:text,status:"idea",notes:"Created from document intelligence."}});
  if(process.env.OPENAI_API_KEY) await db.researchProject.update({where:{id:item.id},data:{embedding:await createEmbedding(item.title+"\n"+item.question)}});
  await db.knowledgeLink.upsert({where:{fromType_fromId_toType_toId_relation:{fromType:"research",fromId:item.id,toType:"library",toId:file.id,relation:"cites"}},update:{},create:{fromType:"research",fromId:item.id,toType:"library",toId:file.id,relation:"cites"}});
  return NextResponse.json({kind:"research project",id:item.id});
 }
 if(kind==="content"){
  const item=await db.contentItem.create({data:{title:text.slice(0,120),format:"post",stage:"idea",sourceIdea:text}});
  await db.knowledgeLink.upsert({where:{fromType_fromId_toType_toId_relation:{fromType:"content",fromId:item.id,toType:"library",toId:file.id,relation:"derived from"}},update:{},create:{fromType:"content",fromId:item.id,toType:"library",toId:file.id,relation:"derived from"}});
  return NextResponse.json({kind:"content idea",id:item.id});
 }
 } catch { return NextResponse.json({error:"Unable to promote library item."},{status:500}); }
}