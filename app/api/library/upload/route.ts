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

function hasPdfSignature(buffer: Buffer) { return buffer.subarray(0, 5).toString("ascii") === "%PDF-"; }
function hasZipSignature(buffer: Buffer) { return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04; }

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

    if (extension === ".pdf" && !hasPdfSignature(buffer)) return NextResponse.json({ error: "The uploaded file is not a valid PDF." }, { status: 415 });
    if (extension === ".docx" && !hasZipSignature(buffer)) return NextResponse.json({ error: "The uploaded file is not a valid DOCX container." }, { status: 415 });
    if ((extension === ".txt" || extension === ".md") && file.type && !["text/plain","text/markdown","text/x-markdown"].includes(file.type)) {
      return NextResponse.json({ error: "Text files must use a text MIME type." }, { status: 415 });
    }

    let extractedText = "";
    if (extension === ".pdf") extractedText = (await pdfParse(buffer)).text;
    else if (extension === ".docx") extractedText = (await mammoth.extractRawText({ buffer })).value;
    else extractedText = buffer.toString("utf8");

    const root = process.env.NEXUM_STORAGE_PATH || path.join(process.cwd(), "storage", "library");
    const storedName = randomUUID() + "-" + originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageFile = path.resolve(root, storedName);

    await mkdir(root, { recursive: true });
    await writeFile(storageFile, buffer);

    try {
      const item = await db.libraryFile.create({
        data: {
          name: originalName,
          type: format.type,
          url: "",
          description: "",
          tags: "",
          documentText: extractedText,
          storagePath: storedName,
          mimeType: format.mime,
          sizeBytes: buffer.byteLength
        }
      });
      return NextResponse.json({ item, characters: extractedText.length });
    } catch (error) {
      const { unlink } = await import("fs/promises");
      await unlink(storageFile).catch(() => {});
      throw error;
    }
  } catch {
    return NextResponse.json({ error: "Unable to store and extract this file." }, { status: 500 });
  }
}
