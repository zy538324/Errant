import { createHash, randomInt } from "node:crypto";
import { db } from "@/lib/db";
import { createCustomerSession } from "@/lib/session";
import { getClientIpAddress } from "@/lib/admin-login-security";
import { getResendMailStatus, sendResendMail } from "@/lib/resend-mail";
import { getGraphMailStatus, sendMicrosoft365Mail } from "@/lib/microsoft-graph-mail";
import { CHECKOUT_EXPIRY_SECONDS } from "@/lib/checkout-expiry";

const LOGIN_CODE_TTL_MINUTES = 10;
const MAX_CODE_ATTEMPTS = 5;
const MAX_RECENT_EMAIL_REQUESTS = 3;
const MAX_RECENT_IP_REQUESTS = 20;
const REQUEST_WINDOW_MS = 15 * 60 * 1000;

type LoginEmailMessage = {
  from: string;
  replyTo?: string | null;
  to: string;
  subject: string;
  text: string;
  html: string;
};

type LoginEmailDeliveryResult = {
  transport: "resend" | "microsoft-365" | "webhook";
  sender: string;
  replyTo?: string | null;
  requestId?: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function createSixDigitCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

async function assertLoginRequestAllowed(email: string, ipAddress: string) {
  const threshold = new Date(Date.now() - REQUEST_WINDOW_MS);
  const [emailRequests, ipRequests] = await Promise.all([
    db.customerLoginCode.count({
      where: {
        email,
        createdAt: { gte: threshold },
      },
    }),
    db.customerLoginCode.count({
      where: {
        ipAddress,
        createdAt: { gte: threshold },
      },
    }),
  ]);

  if (emailRequests >= MAX_RECENT_EMAIL_REQUESTS || ipRequests >= MAX_RECENT_IP_REQUESTS) {
    throw new Error("Too many login code requests. Try again in 15 minutes.");
  }
}

async function isCustomerEligibleForLoginCode(customerId: string) {
  const activeCheckoutThreshold = new Date(Date.now() - CHECKOUT_EXPIRY_SECONDS * 1000);

  const eligibleOrder = await db.order.findFirst({
    where: {
      customerId,
      OR: [
        { status: { in: ["PAID", "FULFILLED"] } },
        {
          status: "PENDING",
          stripeCheckoutId: { not: null },
          createdAt: { gte: activeCheckoutThreshold },
        },
      ],
    },
    select: { id: true },
  });

  return Boolean(eligibleOrder);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getCustomerLoginSenderCandidates() {
  const candidates = [
    process.env.RESEND_TRANSACTIONAL_SENDER_EMAIL?.trim(),
    process.env.CUSTOMER_LOGIN_EMAIL_FROM?.trim(),
    process.env.MS_GRAPH_TRANSACTIONAL_SENDER_EMAIL?.trim(),
  ];

  return [...new Set(candidates.filter((value): value is string => Boolean(value)))];
}

function getCustomerLoginSenderEmail() {
  return getCustomerLoginSenderCandidates()[0] ?? null;
}

function getCustomerLoginReplyToEmail() {
  return process.env.CUSTOMER_LOGIN_REPLY_TO?.trim() || null;
}

function buildLoginEmailMessage(email: string, code: string): LoginEmailMessage {
  const from = getCustomerLoginSenderEmail();
  const subject = "Your Errant Arts login code";
  const text = `Your Errant Arts login code is: ${code}\n\nThis code will expire in ${LOGIN_CODE_TTL_MINUTES} minutes.\n\nYou requested this code for access to your Errant Arts customer downloads:\nhttps://errant-arts.co.uk\n\nIf you did not request this, you can safely ignore this email.\n\nErrant Arts\nhttps://errant-arts.co.uk`;
  const safeCode = escapeHtml(code);

  if (!from) {
    throw new Error("Customer login email sender is not configured.");
  }

  return {
    from,
    replyTo: getCustomerLoginReplyToEmail(),
    to: email,
    subject,
    text,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px">
        <h1 style="font-size:24px;margin:0 0 16px">Your Errant Arts login code</h1>
        <p>Use this code to access your customer downloads:</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:700;margin:24px 0">${safeCode}</p>
        <p>This code expires in ${LOGIN_CODE_TTL_MINUTES} minutes.</p>
        <p>You requested this code for access to your Errant Arts customer downloads:</p>
        <p><a href="https://errant-arts.co.uk">https://errant-arts.co.uk</a></p>
        <p style="color:#6b7280;font-size:14px">If you did not request this, you can ignore this email.</p>
      </div>
    `,
  };
}

async function sendLoginCodeEmailWithResend(
  message: LoginEmailMessage,
): Promise<LoginEmailDeliveryResult | null> {
  const resendStatus = getResendMailStatus();

  if (!resendStatus.configured) {
    return null;
  }

  const result = await sendResendMail({
    from: message.from,
    replyTo: message.replyTo,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });

  return {
    transport: "resend" as const,
    sender: message.from,
    replyTo: message.replyTo,
    requestId: result.requestId,
  };
}

async function sendLoginCodeEmailWithMicrosoft365(
  message: LoginEmailMessage,
): Promise<LoginEmailDeliveryResult | null> {
  const graphStatus = getGraphMailStatus({
    senderEmail: message.from,
    replyToEmail: message.replyTo,
  });

  if (!graphStatus.configured) {
    return null;
  }

  const result = await sendMicrosoft365Mail({
    fromEmail: message.from,
    replyToEmail: message.replyTo,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
    contentType: "Text",
  });

  return {
    transport: "microsoft-365" as const,
    sender: message.from,
    replyTo: message.replyTo,
    requestId: result.requestId,
  };
}

async function sendLoginCodeEmailWithWebhook(
  message: LoginEmailMessage,
): Promise<LoginEmailDeliveryResult | null> {
  const webhookUrl = process.env.CUSTOMER_LOGIN_EMAIL_WEBHOOK_URL?.trim();
  const webhookToken = process.env.CUSTOMER_LOGIN_EMAIL_WEBHOOK_TOKEN?.trim();

  if (!webhookUrl) {
    return null;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(webhookToken ? { authorization: `Bearer ${webhookToken}` } : {}),
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Customer login email webhook failed (${response.status})${detail ? `: ${detail}` : "."}`,
    );
  }

  return {
    transport: "webhook" as const,
    sender: message.from,
    replyTo: message.replyTo,
  };
}

async function sendLoginCodeEmail(
  email: string,
  code: string,
): Promise<LoginEmailDeliveryResult> {
  const message = buildLoginEmailMessage(email, code);
  const resendResult = await sendLoginCodeEmailWithResend(message);

  if (resendResult) {
    return resendResult;
  }

  let graphError: unknown = null;
  const senderCandidates = getCustomerLoginSenderCandidates();

  for (const sender of senderCandidates) {
    try {
      const graphResult = await sendLoginCodeEmailWithMicrosoft365({
        ...message,
        from: sender,
      });
      if (graphResult) {
        return graphResult;
      }
    } catch (error) {
      graphError = error;

      if (
        !(error instanceof Error) ||
        !/ErrorInvalidUser|requested user .* is invalid/i.test(error.message)
      ) {
        break;
      }
    }
  }

  const webhookResult = await sendLoginCodeEmailWithWebhook(message);
  if (webhookResult) {
    return webhookResult;
  }

  if (graphError instanceof Error) {
    throw graphError;
  }

  throw new Error(
    "Customer login email delivery is not configured. Configure RESEND_API_KEY and a customer login sender, or configure Microsoft Graph.",
  );
}

export async function requestCustomerLoginCode(req: Request, emailInput: string) {
  const email = normalizeEmail(emailInput);
  const ipAddress = getClientIpAddress(req);

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  await assertLoginRequestAllowed(email, ipAddress);

  const user = await db.user.findUnique({
    where: { email },
    include: { customer: true },
  });

  if (!user || user.role !== "CUSTOMER" || !user.customer) {
    await db.auditLog.create({
      data: {
        action: "customer.login.request.unknown_email",
        entityType: "Customer",
        entityId: email,
        metadataJson: JSON.stringify({ email, ipAddress }),
      },
    }).catch(() => null);
    return;
  }

  const isEligible = await isCustomerEligibleForLoginCode(user.customer.id);
  if (!isEligible) {
    await db.auditLog.create({
      data: {
        action: "customer.login.request.no_eligible_order",
        entityType: "Customer",
        entityId: user.customer.id,
        metadataJson: JSON.stringify({ email, ipAddress }),
      },
    }).catch(() => null);
    return;
  }

  const code = createSixDigitCode();
  const loginCode = await db.customerLoginCode.create({
    data: {
      userId: user.id,
      email,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + LOGIN_CODE_TTL_MINUTES * 60 * 1000),
      ipAddress,
    },
  });

  try {
    const delivery = await sendLoginCodeEmail(email, code);
    await db.auditLog.create({
      data: {
        action: "customer.login.email.sent",
        entityType: "CustomerLoginCode",
        entityId: loginCode.id,
        metadataJson: JSON.stringify({
          email,
          ipAddress,
          transport: delivery.transport,
          sender: delivery.sender,
          replyTo: delivery.replyTo ?? null,
          requestId: delivery.requestId ?? null,
        }),
      },
    }).catch(() => null);
  } catch (error) {
    await db.auditLog.create({
      data: {
        action: "customer.login.email.failed",
        entityType: "CustomerLoginCode",
        entityId: loginCode.id,
        metadataJson: JSON.stringify({
          email,
          ipAddress,
          attemptedSenders: getCustomerLoginSenderCandidates(),
          error: error instanceof Error ? error.message : "Unknown delivery error.",
        }),
      },
    }).catch(() => null);
    throw error;
  }
}

export async function verifyCustomerLoginCode(input: {
  email: string;
  code: string;
}) {
  const email = normalizeEmail(input.email);
  const code = input.code.trim();

  if (!/^\d{6}$/.test(code)) {
    throw new Error("Enter the 6-digit code from your email.");
  }

  const loginCode = await db.customerLoginCode.findFirst({
    where: {
      email,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { include: { customer: true } },
    },
  });

  if (!loginCode || !loginCode.user.customer || loginCode.user.role !== "CUSTOMER") {
    throw new Error("Invalid or expired login code.");
  }

  const isEligible = await isCustomerEligibleForLoginCode(loginCode.user.customer.id);
  if (!isEligible) {
    throw new Error("Invalid or expired login code.");
  }

  if (loginCode.attempts >= MAX_CODE_ATTEMPTS) {
    throw new Error("Too many attempts. Request a new login code.");
  }

  if (loginCode.codeHash !== hashCode(code)) {
    await db.customerLoginCode.update({
      where: { id: loginCode.id },
      data: { attempts: { increment: 1 } },
    });
    throw new Error("Invalid or expired login code.");
  }

  await db.customerLoginCode.update({
    where: { id: loginCode.id },
    data: { consumedAt: new Date() },
  });

  await db.customerLoginCode.updateMany({
    where: {
      userId: loginCode.userId,
      consumedAt: null,
      id: { not: loginCode.id },
    },
    data: { consumedAt: new Date() },
  });

  await createCustomerSession(loginCode.userId);
  return loginCode.user.customer;
}
