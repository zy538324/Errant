import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminSettingsSnapshot } from "@/lib/admin-settings";
import { putObjectBuffer, getObjectBuffer, listObjectsByPrefix } from "@/lib/storage";

async function requireDiagnosticAccess(req: Request) {
  const configuredToken = process.env.ADMIN_MIGRATION_TOKEN?.trim();
  const suppliedToken = req.headers.get("x-admin-migration-token")?.trim();

  if (configuredToken && suppliedToken && suppliedToken === configuredToken) {
    return;
  }

  await requireAdmin();
}

function redact(value: string) {
  if (!value) return "missing";
  if (value.length <= 8) return "configured";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export async function POST(req: Request) {
  try {
    await requireDiagnosticAccess(req);
    const settings = getAdminSettingsSnapshot();
    const testKey = `_diagnostics/r2-write-test-${Date.now()}.txt`;
    const body = Buffer.from(`Errant Arts R2 diagnostic ${new Date().toISOString()}\n`, "utf8");

    const results: Array<{ step: string; ok: boolean; detail: string }> = [];

    results.push({
      step: "config",
      ok: true,
      detail: JSON.stringify({
        endpoint: settings.storage.r2Endpoint,
        bucket: settings.storage.r2Bucket,
        publicBaseUrl: settings.storage.r2PublicBaseUrl,
        accessKeyId: redact(settings.storage.r2AccessKeyId),
        secretAccessKey: settings.storage.r2SecretAccessKey ? "configured" : "missing",
      }),
    });

    try {
      await listObjectsByPrefix("_diagnostics/");
      results.push({ step: "list", ok: true, detail: "Bucket list request succeeded." });
    } catch (error) {
      results.push({
        step: "list",
        ok: false,
        detail: error instanceof Error ? error.message : "Bucket list request failed.",
      });
    }

    try {
      await putObjectBuffer(testKey, body, "text/plain; charset=utf-8", {
        cacheControl: "private, max-age=0, no-store",
      });
      results.push({ step: "put", ok: true, detail: `Wrote ${testKey}.` });
    } catch (error) {
      results.push({
        step: "put",
        ok: false,
        detail: error instanceof Error ? error.message : "Object write request failed.",
      });
    }

    try {
      const readBack = await getObjectBuffer(testKey);
      results.push({
        step: "get",
        ok: readBack.body.length === body.length,
        detail: `Read ${readBack.body.length} bytes from ${testKey}.`,
      });
    } catch (error) {
      results.push({
        step: "get",
        ok: false,
        detail: error instanceof Error ? error.message : "Object read request failed.",
      });
    }

    return NextResponse.json({
      ok: results.every((result) => result.ok),
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to run R2 diagnostics.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
