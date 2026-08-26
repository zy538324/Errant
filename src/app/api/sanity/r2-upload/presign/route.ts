import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSanityStudioUploadGrant } from "@/sanity/lib/studio-auth";
import { createUploadDescriptor, ensureR2BrowserUploadCors } from "@/lib/storage";

const uploadPresignSchema = z.object({
  collectionSlug: z.string().trim().min(1).max(120),
  filename: z.string().trim().min(1).max(240),
  contentType: z.string().trim().min(1).max(120),
  bytes: z.number().int().positive().max(100 * 1024 * 1024),
});

function getAllowedUploadOrigins(req: Request) {
  const requestOrigin = req.headers.get("origin")?.trim();
  const appUrl = process.env.APP_URL?.trim().replace(/\/+$/, "");


  return Array.from(
    new Set(
      [
        requestOrigin,
        appUrl,
        "http://localhost:3000",
        "http://127.0.0.1:3333",
      ].filter((value): value is string => Boolean(value)),
    ),
  );
}

export async function POST(req: Request) {
  try {
    await requireSanityStudioUploadGrant(req);
    const payload = uploadPresignSchema.parse(await req.json());

    await ensureR2BrowserUploadCors(getAllowedUploadOrigins(req));

    const descriptor = await createUploadDescriptor(payload.collectionSlug, payload.filename, payload.contentType);
    return NextResponse.json({ ...descriptor, bytes: payload.bytes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create upload URL.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
