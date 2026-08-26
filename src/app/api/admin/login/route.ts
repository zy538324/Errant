import { authenticator } from "otplib";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  assertAdminLoginAllowed,
  getClientIpAddress,
  recordAdminLoginFailure,
} from "@/lib/admin-login-security";
import { createAdminSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";
import { adminLoginSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function buildMfaEnrollment(secret: string, username: string) {
  const issuer = process.env.MFA_ISSUER?.trim() || "Errant Arts Admin";
  const otpauthUrl = authenticator.keyuri(username, issuer, secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 2, scale: 6 });
  return { otpauthUrl, qrCodeDataUrl };
}

export async function POST(req: Request) {
  try {
    const payload = adminLoginSchema.parse(await req.json());
    const ipAddress = getClientIpAddress(req);
    await assertAdminLoginAllowed(payload.username, ipAddress);
    const user = await db.user.findUnique({ where: { username: payload.username } });

    if (!user || user.role !== "ADMIN" || !user.passwordHash) {
      await recordAdminLoginFailure({ username: payload.username, ipAddress, reason: "unknown-admin-user" });
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const isValidPassword = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isValidPassword) {
      await recordAdminLoginFailure({ username: payload.username, ipAddress, reason: "invalid-password" });
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    if (!user.mfaSecret) {
      const mfaSecret = authenticator.generateSecret();
      await db.user.update({ where: { id: user.id }, data: { mfaSecret, mfaEnabled: false } });
      const enrollment = await buildMfaEnrollment(mfaSecret, user.username);

      return NextResponse.json({
        requiresMfaEnrollment: true,
        requiresMfa: true,
        mfaSecret,
        ...enrollment,
        message: "Scan the QR code in an authenticator app, then enter the 6-digit code to complete sign-in.",
      });
    }

    if (!payload.token) {
      await recordAdminLoginFailure({ username: payload.username, ipAddress, reason: "missing-mfa-token" });
      return NextResponse.json({ error: "A 6-digit MFA token is required.", requiresMfa: true }, { status: 401 });
    }

    const tokenValid = authenticator.verify({ token: payload.token, secret: user.mfaSecret });
    if (!tokenValid) {
      await recordAdminLoginFailure({ username: payload.username, ipAddress, reason: "invalid-mfa-token" });
      return NextResponse.json({ error: "Invalid MFA token.", requiresMfa: true }, { status: 401 });
    }

    await db.user.update({ where: { id: user.id }, data: { mfaEnabled: true } });
    await createAdminSession(user.id);
    await writeAuditLog({ userId: user.id, action: "admin.login", entityType: "User", entityId: user.id, metadata: { username: user.username } });

    return NextResponse.json({ success: true, redirectTo: "/admin" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to complete admin login.";
    const status = message.includes("Too many login attempts") ? 429 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
