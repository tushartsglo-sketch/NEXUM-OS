import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const TYPES = new Set(["knowledge", "research", "library", "content", "project"]);
const RELATIONS = new Set(["relates to", "supports", "contradicts", "extends", "derived from", "cites", "inspired", "informs", "produces", "belongs to"]);

function value(input: unknown) {
  return typeof input === "string" ? input.trim() : "";
}

function validLink(body: any) {
  const fromType = value(body.fromType), fromId = value(body.fromId), toType = value(body.toType), toId = value(body.toId), relation = value(body.relation);
  if (!fromType || !fromId || !toType || !toId || !relation) return null;
  if (!TYPES.has(fromType) || !TYPES.has(toType) || !RELATIONS.has(relation)) return null;
  if (fromId.length > 100 || toId.length > 100) return null;
  return { fromType, fromId, toType, toId, relation };
}

export async function GET(request: NextRequest) {
  try {
    const p = request.nextUrl.searchParams;
    const where: any = {};
    for (const [key, allowed] of [["fromType", TYPES], ["toType", TYPES]] as const) {
      const v = p.get(key);
      if (v) {
        if (!allowed.has(v)) return NextResponse.json({ error: "Invalid relationship type." }, { status: 400 });
        where[key] = v;
      }
    }
    for (const key of ["fromId", "toId"]) {
      const v = p.get(key);
      if (v) {
        if (v.length > 100) return NextResponse.json({ error: "Relationship identifier is too long." }, { status: 400 });
        where[key] = v;
      }
    }
    return NextResponse.json(await db.knowledgeLink.findMany({ where, orderBy: { createdAt: "desc" } }));
  } catch {
    return NextResponse.json({ error: "Unable to load relationships." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const link = validLink(await request.json());
    if (!link) return NextResponse.json({ error: "Invalid relationship fields." }, { status: 400 });
    return NextResponse.json(await db.knowledgeLink.upsert({
      where: { fromType_fromId_toType_toId_relation: link },
      update: {},
      create: link
    }));
  } catch {
    return NextResponse.json({ error: "Unable to create relationship." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const link = validLink(await request.json());
    if (!link) return NextResponse.json({ error: "Invalid relationship fields." }, { status: 400 });
    await db.knowledgeLink.deleteMany({ where: link });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete relationship." }, { status: 500 });
  }
}
