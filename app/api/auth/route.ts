import { NextRequest, NextResponse } from "next/server";
export async function GET(request:NextRequest){
 const token=process.env.NEXUM_ACCESS_TOKEN;
 if(!token)return NextResponse.json({error:"NEXUM_ACCESS_TOKEN is not configured."},{status:503});
 const provided=request.headers.get("x-nexum-access-token");
 if(provided!==token)return NextResponse.json({error:"Private NEXUM access required."},{status:401});
 const response=NextResponse.json({authenticated:true});
 response.cookies.set("nexum_access",token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:60*60*24*30});
 return response;
}