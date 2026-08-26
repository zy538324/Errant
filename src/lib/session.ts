import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getAdminSettingsSnapshot } from "@/lib/admin-settings";

const ADMIN_SESSION_COOKIE = "errant_admin_session";
const CUSTOMER_SESSION_COOKIE = "errant_customer_session";
const CUSTOMER_SESSION_DURATION_DAYS = 30;

function getSessionDurationMs() {
  return 1000 * 60 * 60 * getAdminSettingsSnapshot().security.adminSessionHours;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function createSessionCookie(options: {
  userId: string;
  cookieName: string;
  expiresAt: Date;
  clearExistingSessionsForUser?: boolean;
  sameSite?: "strict" | "lax";
}) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  if (options.clearExistingSessionsForUser) {
    await db.session.deleteMany({
      where: { userId: options.userId },
    });
  }

  await db.session.create({
    data: {
      userId: options.userId,
      tokenHash,
      expiresAt: options.expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(options.cookieName, rawToken, {
    httpOnly: true,
    sameSite: options.sameSite ?? "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: options.expiresAt,
  });
}

export async function createAdminSession(userId: string) {
  const expiresAt = new Date(Date.now() + getSessionDurationMs());

  await createSessionCookie({
    userId,
    cookieName: ADMIN_SESSION_COOKIE,
    expiresAt,
    clearExistingSessionsForUser: true,
    sameSite: "lax",
  });
}

export async function createCustomerSession(userId: string) {
  const expiresAt = new Date(
    Date.now() + CUSTOMER_SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
  );

  await createSessionCookie({
    userId,
    cookieName: CUSTOMER_SESSION_COOKIE,
    expiresAt,
    sameSite: "lax",
  });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  cookieStore.delete(ADMIN_SESSION_COOKIE);

  if (!token) {
    return;
  }

  await db.session.deleteMany({
    where: { tokenHash: hashToken(token) },
  });
}

export async function destroyCustomerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  cookieStore.delete(CUSTOMER_SESSION_COOKIE);

  if (!token) {
    return;
  }

  await db.session.deleteMany({
    where: { tokenHash: hashToken(token) },
  });
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionCookies = [
    {
      name: ADMIN_SESSION_COOKIE,
      token: cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
    },
    {
      name: CUSTOMER_SESSION_COOKIE,
      token: cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value,
    },
  ].filter((entry): entry is { name: string; token: string } =>
    Boolean(entry.token),
  );

  if (sessionCookies.length === 0) {
    return null;
  }

  for (const { name, token } of sessionCookies) {
    const tokenHash = hashToken(token);
    let session:
      | {
          id: string;
          expiresAt: Date;
          user: {
            id: string;
            email: string;
            username: string;
            passwordHash: string | null;
            role: string;
            mfaEnabled: boolean;
            mfaSecret: string | null;
            createdAt: Date;
            updatedAt: Date;
          };
        }
      | null = null;

    try {
      session = await db.session.findUnique({
        where: { tokenHash },
        include: { user: true },
      });
    } catch {
      continue;
    }

    if (!session || session.expiresAt < new Date()) {
      cookieStore.delete(name);
      if (session) {
        await db.session.delete({ where: { id: session.id } }).catch(() => null);
      }
      continue;
    }

    return session.user;
  }

  return null;
}
