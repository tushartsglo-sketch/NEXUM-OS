import { createEmbedding } from "@/lib/embedding";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function text(value: unknown, name: string, required = false) {
  if (typeof value !== "string") {
    if (required) throw new Error(name + " is required.");
    return "";
  }
  const result = value.trim();
  if (required && !result) throw new Error(name + " is required.");
  return result;
}

function fail(error: unknown, status = 400) {
  return NextResponse.json({ error: error instanceof Error ? error.message : "Library request failed." }, { status });
}

export async function GET() {
  try {
    return NextResponse.json(await db.libraryFile.findMany({ orderBy: { updatedAt: "desc" } }));
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const b = await request.json();
    const name = text(b.name, "name", true);
    const type = text(b.type) || "link";
    const url = text(b.url);
    const description = text(b.description);
    const tags = text(b.tags);
    const documentText = text(b.documentText);
    if (type === "link") {
      if (!url) throw new Error("url is required for link resources.");
      new URL(url);
    }

    const created = await db.libraryFile.create({
      data: {
        name,
        type,
        url,
        description,
        tags,
        documentText,
        embedding: await createEmbedding(name + "\n" + description + "\n" + tags + "\n" + documentText)
      }
    });
    return NextResponse.json(created);
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const b = await request.json();
    const id = text(b.id, "id", true);
    const name = text(b.name, "name", true);
    const type = text(b.type) || "link";
    const url = text(b.url);
    const description = text(b.description);
    const tags = text(b.tags);
    const documentText = text(b.documentText);
    if (type === "link" && url) new URL(url);

    const updated = await db.libraryFile.update({
      where: { id },
      data: {
        name,
        type,
        url,
        description,
        tags,
        documentText,
        embedding: await createEmbedding(name + "\n" + description + "\n" + tags + "\n" + documentText)
      }
    });
    return NextResponse.json(updated);
  } catch (error) {
    return fail(error);
  }
}
