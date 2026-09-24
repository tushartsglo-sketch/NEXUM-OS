import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean) : [];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) return NextResponse.json({ error: "Library item id is required." }, { status: 400 });
    const file = await db.libraryFile.findUnique({ where: { id } });
    if (!file) return NextResponse.json({ error: "Library item not found." }, { status: 404 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });
    if (!file.documentText.trim()) return NextResponse.json({ error: "This library item has no extracted document text to analyze." }, { status: 400 });
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + process.env.OPENAI_API_KEY },
      body: JSON.stringify({ model: process.env.NEXUM_AI_MODEL || "gpt-5-mini", instructions: "Analyze only the supplied document. Return JSON with summary plus arrays: keyPoints, concepts, questions, contradictions, contentIdeas. Do not invent facts.", input: "DOCUMENT TITLE: " + file.name + "\n\nDOCUMENT:\n" + file.documentText.slice(0, 60000) })
    });
    if (!response.ok) return NextResponse.json({ error: "AI provider request failed." }, { status: 502 });
    const data = await response.json();
    let raw = String(data.output_text || "").trim();
    if (raw.startsWith("```")) raw = raw.split("\n").slice(1, -1).join("\n").trim();
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { return NextResponse.json({ error: "The document analysis returned invalid structured data." }, { status: 502 }); }
    const analysis = { summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "", keyPoints: strings(parsed.keyPoints), concepts: strings(parsed.concepts), questions: strings(parsed.questions), contradictions: strings(parsed.contradictions), contentIdeas: strings(parsed.contentIdeas) };
    await db.documentAnalysis.upsert({ where: { libraryFileId: file.id }, update: { summary: analysis.summary, keyPoints: JSON.stringify(analysis.keyPoints), concepts: JSON.stringify(analysis.concepts), questions: JSON.stringify(analysis.questions), contradictions: JSON.stringify(analysis.contradictions), contentIdeas: JSON.stringify(analysis.contentIdeas) }, create: { libraryFileId: file.id, summary: analysis.summary, keyPoints: JSON.stringify(analysis.keyPoints), concepts: JSON.stringify(analysis.concepts), questions: JSON.stringify(analysis.questions), contradictions: JSON.stringify(analysis.contradictions), contentIdeas: JSON.stringify(analysis.contentIdeas) } });
    return NextResponse.json({ file: { id: file.id, name: file.name }, analysis, saved: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to analyze document." }, { status: 500 });
  }
}