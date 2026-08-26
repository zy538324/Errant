import { db } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_IP = 10;
const MAX_ATTEMPTS_PER_USERNAME = 5;

function parseMetadataJson(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function getMetadataString(
  metadata: Record<string, unknown> | null,
  key: "username" | "ipAddress",
): string | null {
  if (!metadata) return null;
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value : null;
}

export function getClientIpAddress(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function assertAdminLoginAllowed(username: string, ipAddress: string) {
  const threshold = new Date(Date.now() - WINDOW_MS);
  const recentFailures = await db.auditLog.findMany({
    where: {
      action: { in: ["admin.login.failed", "admin.login.rate_limited"] },
      createdAt: { gte: threshold },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  let ipFailures = 0;
  let usernameFailures = 0;

  for (const entry of recentFailures) {
    const meta = parseMetadataJson(entry.metadataJson);
    const failureIp = getMetadataString(meta, "ipAddress");
    const failureUsername = getMetadataString(meta, "username");

    if (failureIp && failureIp === ipAddress) ipFailures += 1;
    if (failureUsername && failureUsername === username) usernameFailures += 1;
  }

  if (ipFailures >= MAX_ATTEMPTS_PER_IP || usernameFailures >= MAX_ATTEMPTS_PER_USERNAME) {
    await db.auditLog.create({
      data: {
        action: "admin.login.rate_limited",
        entityType: "User",
        entityId: username || ipAddress,
        metadataJson: JSON.stringify({ username, ipAddress }),
      },
    });
    throw new Error("Too many login attempts. Try again in 15 minutes.");
  }
}

export async function recordAdminLoginFailure(input: {
  username: string;
  ipAddress: string;
  reason: string;
}) {
  await db.auditLog.create({
    data: {
      action: "admin.login.failed",
      entityType: "User",
      entityId: input.username || input.ipAddress,
      metadataJson: JSON.stringify({
        username: input.username,
        ipAddress: input.ipAddress,
        reason: input.reason,
      }),
    },
  });
}
