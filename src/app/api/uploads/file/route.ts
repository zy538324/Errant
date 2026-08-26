import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createUploadDescriptor, putObjectBuffer } from "@/lib/storage";
import { uploadPresignSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const formData = await req.formData();
    const file = formData.get("file");
    const collectionSlug = String(formData.get("collectionSlug") ?? "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "An image file is required." }, { status: 400 });
    }

    const payload = uploadPresignSchema.parse({
      collectionSlug,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      bytes: file.size,
    });

    if (!payload.contentType.toLowerCase().startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are supported." }, { status: 400 });
    }

    const descriptor = await createUploadDescriptor(payload.collectionSlug, payload.filename, payload.contentType);
    const bytes = Buffer.from(await file.arrayBuffer());

    await putObjectBuffer(descriptor.objectKey, bytes, payload.contentType, {
      cacheControl: "private, max-age=0, no-store",
    });

    return NextResponse.json({
      storageKey: descriptor.objectKey,
      objectKey: descriptor.objectKey,
      filename: payload.filename,
      mimeType: payload.contentType,
      bytes: payload.bytes,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload image.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
