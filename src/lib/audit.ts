import { db } from "@/lib/db";

export async function writeAuditLog(input: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  const metadataJson = input.metadata
    ? JSON.stringify(input.metadata)
    : null;

  try {
    await db.auditLog.create({
      data: {
        userId: input.userId ?? undefined,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadataJson,
      },
    });
  } catch (error) {
    // Audit logging must never break primary flows.
    console.error("[audit] failed to write audit log", error);
  }
}
