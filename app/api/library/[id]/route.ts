import { NextRequest, NextResponse } from "next/server";
import { readFile, unlink } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id || id.length > 100) return NextResponse.json({ error: "Invalid library item id." }, { status: 400 });
  const item = await db.libraryFile.findUnique({ where: { id } });
  if (!item || !item.storagePath) return NextResponse.json({ error: "Stored file not found." }, { status: 404 });
  try {
    const root = process.env.NEXUM_STORAGE_PATH || path.join(process.cwd(), "storage", "library");
    const filePath = path.resolve(root, path.basename(item.storagePath));
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, { headers: { "Content-Type": item.mimeType || "application/octet-stream", "Content-Disposition": 'inline; filename="' + item.name.replace(/"/g, "") + '"' } });
  } catch { return NextResponse.json({ error: "File is unavailable." }, { status: 404 }); }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id || id.length > 100) return NextResponse.json({ error: "Invalid library item id." }, { status: 400 });
  const item = await db.libraryFile.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Library item not found." }, { status: 404 });
  if (item.storagePath) { try { const root = process.env.NEXUM_STORAGE_PATH || path.join(process.cwd(), "storage", "library"); await unlink(path.resolve(root, path.basename(item.storagePath))); } catch {} }
  await db.libraryFile.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}