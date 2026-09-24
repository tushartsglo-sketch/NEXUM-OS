import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const ALLOWED = new Map([
  [".pdf", { type: "pdf", mime: "application/pdf" }],
  [".docx", { type: "document", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }],
  [".txt", { type: "document", mime: "text/plain" }],
  [".md", { type: "document", mime: "text/markdown" }]
]);

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "A file is required." }, { status: 400 });

    const maxBytes = 25 * 1024 * 1024;
    if (!Number.isFinite(file.size) || file.size <= 0) return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
    if (file.size > maxBytes) return NextResponse.json({ error: "File exceeds the 25 MB limit." }, { status: 413 });

    const originalName = file.name.trim();
    const extension = path.extname(originalName).toLowerCase();
    const format = ALLOWED.get(extension);
    if (!format) return NextResponse.json({ error: "Supported formats: PDF, DOCX, TXT, MD." }, { status: 415 });

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength !== file.size) return NextResponse.json({ error: "Uploaded file could not be read reliably." }, { status: 400 });

    let text = "";
    if (extension === ".pdf") text = (await pdfParse(buffer)).text;
    else if (extension === ".docx") text = (await mammoth.extractRawText({ buffer })).value;
    else text = buffer.toString("utf8");

    const root = process.env.NEXUM_STORAGE_PATH || path.join(process.cwd(), "storage", "library");
    const storedName = randomUUID() + "-" + originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageFile = path.join(root, storedName);

    await mkdir(root, { recursive: true });
    await writeFile(storageFile, buffer);

    const item = await db.libraryFile.create({
      data: {
        name: originalName,
        type: format.type,
        url: "",
        description: "",
        tags: "",
        documentText: text,
        storagePath: path.join("storage", "library", storedName),
        mimeType: format.mime,
        sizeBytes: buffer.byteLength
      }
    });

    return NextResponse.json({ item, characters: text.length });
  } catch {
    return NextResponse.json({ error: "Unable to store and extract this file." }, { status: 500 });
  }
}
