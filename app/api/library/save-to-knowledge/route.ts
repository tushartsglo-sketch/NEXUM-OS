import { NextRequest, NextResponse } from "next/server";
import { createEmbedding } from "@/lib/embedding";
import { db } from "@/lib/db";
export async function POST(request:NextRequest){
 const b=await request.json();
 if(!b.libraryFileId)return NextResponse.json({error:"libraryFileId is required."},{status:400});
 const a=await db.documentAnalysis.findUnique({where:{libraryFileId:b.libraryFileId}});
 const file=await db.libraryFile.findUnique({where:{id:b.libraryFileId}});
 if(!a||!file)return NextResponse.json({error:"Analysis or library file not found."},{status:404});
 const type=b.kind==="content-idea"?"idea":"insight";
 const title=b.title||file.name+" — "+(type==="idea"?"content opportunity":"document insight");
 const content=b.content||a.summary;
 const entry=await db.knowledgeEntry.create({data:{title,type,topic:b.topic||"Document Intelligence",tags:b.tags||"document,ai",content,embedding:await createEmbedding(title+"\n"+content)}});
 await db.knowledgeLink.upsert({where:{fromType_fromId_toType_toId_relation:{fromType:"library",fromId:file.id,toType:"knowledge",toId:entry.id,relation:"informs"}},update:{},create:{fromType:"library",fromId:file.id,toType:"knowledge",toId:entry.id,relation:"informs"}});
 return NextResponse.json(entry);
}