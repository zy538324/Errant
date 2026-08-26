import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createUploadDescriptor, ensureR2BrowserUploadCors } from "@/lib/storage";
import { uploadPresignSchema } from "@/lib/validators";

function getAllowedUploadOrigins(req: Request) {
  const requestOrigin = req.headers.get("origin")?.trim();
  const appUrl = process.env.APP_URL?.trim().replace(/\/+$/, "");


  return Array.from(
    new Set(
      [
        requestOrigin,
        appUrl,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ].filter((value): value is string => Boolean(value)),
    ),
  );
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const payload = uploadPresignSchema.parse(await req.json());

    await ensureR2BrowserUploadCors(getAllowedUploadOrigins(req));

    const descriptor = await createUploadDescriptor(payload.collectionSlug, payload.filename, payload.contentType);
    return NextResponse.json({ ...descriptor, bytes: payload.bytes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create upload URL.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
