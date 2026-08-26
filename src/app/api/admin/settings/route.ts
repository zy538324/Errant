import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import {
  getAdminSecretStatus,
  getAdminSettingsForClient,
  sanitizeAdminSettingsForClient,
  saveAdminSettings,
} from "@/lib/admin-settings";
import { adminSettingsSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireAdmin();
    const { settings, secretStatus } = await getAdminSettingsForClient();
    return NextResponse.json({ settings, secretStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load admin settings.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await requireAdmin();
    const payload = adminSettingsSchema.parse(await req.json());
    const settings = await saveAdminSettings(payload);
    const safeSettings = sanitizeAdminSettingsForClient(settings);
    const secretStatus = getAdminSecretStatus(settings);

    await writeAuditLog({
      userId: admin.id,
      action: "settings.update",
      entityType: "AdminSettings",
      entityId: "singleton",
      metadata: {
        appUrl: settings.app.appUrl,
        r2Bucket: settings.storage.r2Bucket,
        stripeCurrency: settings.stripe.priceCurrency,
      },
    });

    return NextResponse.json({ settings: safeSettings, secretStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save admin settings.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
