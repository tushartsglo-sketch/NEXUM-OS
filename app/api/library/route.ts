import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(){return NextResponse.json(await db.libraryFile.findMany({orderBy:{updatedAt:"desc"}}));}
export async function POST(request:NextRequest){const b=await request.json();return NextResponse.json(await db.libraryFile.create({data:{name:b.name,type:b.type||"link",url:b.url,description:b.description||"",tags:b.tags||"",documentText:b.documentText||""}}));}
export async function PATCH(request:NextRequest){const b=await request.json();return NextResponse.json(await db.libraryFile.update({where:{id:b.id},data:{name:b.name,type:b.type,url:b.url,description:b.description,tags:b.tags,documentText:b.documentText}}));}