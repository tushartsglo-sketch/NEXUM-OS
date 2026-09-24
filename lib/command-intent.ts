import { NextResponse } from "next/server";

export async function classifyCommand(input: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify({
        model: process.env.NEXUM_AI_MODEL || "gpt-5-mini",
        instructions: "Classify the user command. Return JSON only with intent, text, confidence. intent must be search, note, research, or task. Use task only for a clear future action. Use note for information to store, research for an investigation, otherwise search. Do not execute or invent dates.",
        input
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    let raw = String(data.output_text || "").trim();
    if (raw.startsWith("```")) raw = raw.split("\n").slice(1, -1).join("\n").trim();
    const parsed = JSON.parse(raw);
    const intent = typeof parsed.intent === "string" ? parsed.intent.trim() : "";
    const text = typeof parsed.text === "string" ? parsed.text.trim() : "";
    const confidence = Number(parsed.confidence);
    if (!["search", "note", "research", "task"].includes(intent)) return null;
    if (!text || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) return null;
    return { intent, text, confidence };
  } catch { return null; }
}