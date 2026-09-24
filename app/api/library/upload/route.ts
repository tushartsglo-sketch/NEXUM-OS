import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "A file is required." }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();
    let text = "", type = "document", mimeType = file.type || "application/octet-stream";
    if (name.endsWith(".pdf")) { text = (await pdfParse(buffer)).text; type = "pdf"; }
    else if (name.endsWith(".docx")) { text = (await mammoth.extractRawText({ buffer })).value; type = "document"; }
    else if (name.endsWith(".txt") || name.endsWith(".md")) { text = buffer.toString("utf8"); type = "document"; }
    else return NextResponse.json({ error: "Supported formats: PDF, DOCX, TXT, MD." }, { status: 415 });

    const root = process.env.NEXUM_STORAGE_PATH || path.join(process.cwd(), "storage", "library");
    const storedName = randomUUID() + "-" + file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    await mkdir(root, { recursive: true });
    await writeFile(path.join(root, storedName), buffer);
    const item = await db.libraryFile.create({ data: {
      name: file.name, type, url: "", description: "", tags: "", documentText: text,
      storagePath: path.join("storage","library",storedName), mimeType, sizeBytes: buffer.byteLength
    }});
    return NextResponse.json({ item, characters: text.length });
  } catch { return NextResponse.json({ error: "Unable to store and extract this file." }, { status: 500 }); }
}