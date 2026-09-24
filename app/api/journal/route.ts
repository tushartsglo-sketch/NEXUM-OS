import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
function date(v: unknown) { if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error("Date must use YYYY-MM-DD."); const d = new Date(v + "T00:00:00.000Z"); if (Number.isNaN(d.getTime())) throw new Error("Valid date is required."); return d; }
function text(v: unknown) { return typeof v === "string" ? v.trim() : ""; }
function fail(e: unknown, s = 400) { return NextResponse.json({ error: e instanceof Error ? e.message : "Journal request failed." }, { status: s }); }
export async function GET() { try { return NextResponse.json(await db.journalEntry.findMany({ orderBy: { date: "desc" } })); } catch (e) { return fail(e, 500); } }
export async function POST(request: NextRequest) { try { const b = await request.json(); const d = date(b.date); return NextResponse.json(await db.journalEntry.upsert({ where: { date: d }, update: { did: text(b.did), learned: text(b.learned), mistakes: text(b.mistakes), next: text(b.next) }, create: { date: d, did: text(b.did), learned: text(b.learned), mistakes: text(b.mistakes), next: text(b.next) } })); } catch (e) { return fail(e); } }