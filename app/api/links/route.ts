import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request:NextRequest){
 const p=request.nextUrl.searchParams; const fromType=p.get("fromType"),fromId=p.get("fromId");
 if(!fromType||!fromId)return NextResponse.json({error:"fromType and fromId are required."},{status:400});
 return NextResponse.json(await db.knowledgeLink.findMany({where:{fromType,fromId},orderBy:{createdAt:"desc"}}));
}
export async function POST(request:NextRequest){
 const b=await request.json();
 if(!b.fromType||!b.fromId||!b.toType||!b.toId||!b.relation)return NextResponse.json({error:"All relationship fields are required."},{status:400});
 const link=await db.knowledgeLink.upsert({where:{fromType_fromId_toType_toId_relation:{fromType:b.fromType,fromId:b.fromId,toType:b.toType,toId:b.toId,relation:b.relation}},update:{},create:{fromType:b.fromType,fromId:b.fromId,toType:b.toType,toId:b.toId,relation:b.relation}});
 return NextResponse.json(link);
}
export async function DELETE(request:NextRequest){
 const b=await request.json();
 await db.knowledgeLink.deleteMany({where:{fromType:b.fromType,fromId:b.fromId,toType:b.toType,toId:b.toId,relation:b.relation}});
 return NextResponse.json({deleted:true});
}