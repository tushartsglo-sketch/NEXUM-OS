import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "A file is required." }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();
    let text = "";
    let type = "document";
    if (name.endsWith(".pdf")) {
      const parsed = await pdfParse(buffer);
      text = parsed.text;
      type = "pdf";
    } else if (name.endsWith(".docx")) {
      const parsed = await mammoth.extractRawText({ buffer });
      text = parsed.value;
      type = "document";
    } else if (name.endsWith(".txt") || name.endsWith(".md")) {
      text = buffer.toString("utf8");
      type = "document";
    } else {
      return NextResponse.json({ error: "Supported formats: PDF, DOCX, TXT, MD." }, { status: 415 });
    }
    return NextResponse.json({ name: file.name, type, text, characters: text.length });
  } catch {
    return NextResponse.json({ error: "Unable to extract text from this file." }, { status: 500 });
  }
}