type Intent = "search" | "note" | "research" | "task";
type Recurrence = "none" | "daily" | "weekly" | "monthly" | "weekday";

export async function classifyCommand(input: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify({
        model: process.env.NEXUM_AI_MODEL || "gpt-5-mini",
        instructions: "Classify a NEXUM command. Return JSON only with intent, text, confidence and optional task fields date, time, recurrence, recurrenceRule, priority, reminderMinutes. Use task only for a clear future action. Never invent missing scheduling details. Do not execute the request.",
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
    const recurrence = parsed.recurrence === undefined ? "none" : parsed.recurrence;
    const date = typeof parsed.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : undefined;
    const time = typeof parsed.time === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(parsed.time) ? parsed.time : undefined;
    const priority = ["low", "medium", "high"].includes(parsed.priority) ? parsed.priority : "medium";
    const reminderMinutes = Number.isInteger(parsed.reminderMinutes) && parsed.reminderMinutes >= 0 && parsed.reminderMinutes <= 1440 ? parsed.reminderMinutes : 0;
    const recurrenceRule = typeof parsed.recurrenceRule === "string" && /^(weekday|weekday:[0-6])$/.test(parsed.recurrenceRule) ? parsed.recurrenceRule : undefined;
    if (!["search", "note", "research", "task"].includes(intent)) return null;
    if (!["none", "daily", "weekly", "monthly", "weekday"].includes(recurrence)) return null;
    if (!text || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) return null;
    return { intent: intent as Intent, text, confidence, date, time, recurrence: recurrence as Recurrence, recurrenceRule, priority, reminderMinutes };
  } catch {
    return null;
  }
}