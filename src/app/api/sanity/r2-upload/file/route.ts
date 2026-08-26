import { NextResponse } from "next/server";
import { z } from "zod";
import { putObjectBuffer } from "@/lib/storage";
import {
  assertUploadGrantMatches,
  requireSanityStudioUploadGrant,
} from "@/sanity/lib/studio-auth";

const serverUploadSchema = z.object({
  storageKey: z.string().trim().min(1).max(500),
  filename: z.string().trim().min(1).max(240),
  mimeType: z.string().trim().min(1).max(120),
  bytes: z.number().int().positive().max(100 * 1024 * 1024),
});

function formValueToString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

export async function POST(req: Request) {
  try {
    const grant = await requireSanityStudioUploadGrant(req);
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new Error("An image file is required.");
    }

    const payload = serverUploadSchema.parse({
      storageKey: formValueToString(formData.get("storageKey")),
      filename: formValueToString(formData.get("filename")) || file.name,
      mimeType:
        formValueToString(formData.get("mimeType")) ||
        file.type ||
        "application/octet-stream",
      bytes: Number(formValueToString(formData.get("bytes")) || file.size),
    });

    assertUploadGrantMatches(grant, {
      filename: payload.filename,
      mimeType: payload.mimeType,
      bytes: payload.bytes,
      storageKey: payload.storageKey,
    });

    await putObjectBuffer(
      payload.storageKey,
      Buffer.from(await file.arrayBuffer()),
      payload.mimeType,
      { cacheControl: "private, max-age=0, no-store" },
    );

    return NextResponse.json({
      objectKey: payload.storageKey,
      filename: payload.filename,
      mimeType: payload.mimeType,
      bytes: payload.bytes,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload file.";
    const status =
      message.includes("upload access is required") ||
      message.includes("upload access denied")
        ? 403
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
