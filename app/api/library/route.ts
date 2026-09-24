import { createEmbedding } from "@/lib/embedding";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(){return NextResponse.json(await db.libraryFile.findMany({orderBy:{updatedAt:"desc"}}));}
export async function POST(request:NextRequest){const b=await request.json();const data={name:b.name,type:b.type||"link",url:b.url,description:b.description||"",tags:b.tags||"",documentText:b.documentText||""}; const created=await db.libraryFile.create({data:{...data,embedding:await createEmbedding(data.name+"\n"+data.description+"\n"+data.tags+"\n"+data.documentText)}}); return NextResponse.json(created);}
export async function PATCH(request:NextRequest){const b=await request.json();const data={name:b.name,type:b.type,url:b.url,description:b.description,tags:b.tags,documentText:b.documentText};const updated=await db.libraryFile.update({where:{id:b.id},data:{...data,embedding:await createEmbedding(data.name+"\n"+data.description+"\n"+data.tags+"\n"+data.documentText)}});return NextResponse.json(updated);}