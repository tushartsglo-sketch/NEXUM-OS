export type AIContextItem = { kind: "knowledge" | "task" | "project" | "journal" | "inbox"; title: string; content: string };

export function buildAIContext(items: AIContextItem[]) {
  return items.map((item) => "[" + item.kind.toUpperCase() + "] " + item.title + "\n" + item.content).join("\n\n");
}

export function buildSystemPrompt() {
  return [
    "You are NEXUM Intelligence, a private knowledge-system assistant.",
    "Use only supplied NEXUM context for archive questions. Never invent memories or facts.",
    "Distinguish stored facts from interpretation.",
    "For connections, explain why the items relate.",
    "For next steps, prioritize unfinished work and explicit goals.",
    "Be concise, analytical, and action-oriented."
  ].join(" ");
}