import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
function text(v: unknown, name: string){if(typeof v!=="string"||!v.trim())throw new Error(name+" is required.");return v.trim();}
function num(v: unknown,min:number,max:number){const n=Number(v);if(!Number.isFinite(n)||n<min||n>max)throw new Error("Invalid progress.");return n;}
function status(v: unknown){const x=typeof v==="string"?v:"active";if(!["active","completed","paused","archived"].includes(x))throw new Error("Invalid project status.");return x;}
function fail(e:unknown,s=400){return NextResponse.json({error:e instanceof Error?e.message:"Project request failed."},{status:s});}
export async function GET(){try{return NextResponse.json(await db.project.findMany({orderBy:{updatedAt:"desc"}}));}catch(e){return fail(e,500);}}
export async function POST(request:NextRequest){try{const b=await request.json();return NextResponse.json(await db.project.create({data:{name:text(b.name,"name"),description:typeof b.description==="string"?b.description.trim():""}}));}catch(e){return fail(e);}}
export async function PATCH(request:NextRequest){try{const b=await request.json();if(typeof b.id!=="string"||!b.id.trim())return fail(new Error("id is required."));return NextResponse.json(await db.project.update({where:{id:b.id},data:{progress:num(b.progress,0,100),status:status(b.status)}}));}catch(e){return fail(e);}}