import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { randomBytes } from "node:crypto";
import { createCustomerSession } from "@/lib/session";

export async function getCurrentCustomerContext() {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  const customer = await db.customer.findUnique({
    where: { userId: user.id },
  });

  if (!customer) {
    return null;
  }

  return { user, customer };
}

export async function requireAdmin() {
  const user = await getSessionUser();

  if (!user || user.role !== "ADMIN") {
    throw new Error("Admin access denied.");
  }

  return user;
}

export async function requireCustomer() {
  const context = await getCurrentCustomerContext();
  if (!context) {
    throw new Error("Customer authentication is required.");
  }
  return context.customer;
}

function normalizeCheckoutEmail(email: string | null | undefined) {
  const normalized = email?.trim().toLowerCase() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function buildGuestUsernameBase(email: string) {
  const localPart = email.split("@")[0] ?? "customer";
  const normalizedBase = localPart.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const clippedBase = normalizedBase.slice(0, 24);

  if (clippedBase.length >= 3) {
    return clippedBase;
  }

  return "customer";
}

async function createUniqueGuestUsername(email: string) {
  const base = buildGuestUsernameBase(email);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = randomBytes(3).toString("hex");
    const candidate = `${base}_${suffix}`.slice(0, 64);

    const existing = await db.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
  }

  throw new Error("Unable to prepare a unique checkout profile.");
}

export async function resolveCheckoutCustomer(customerEmail?: string | null) {
  const user = await getSessionUser();

  if (user) {
    if (user.role !== "ADMIN") {
      await createCustomerSession(user.id);
    }

    const existingCustomer = await db.customer.findUnique({
      where: { userId: user.id },
    });

    if (existingCustomer) {
      return { customer: existingCustomer, email: user.email };
    }

    const createdCustomer = await db.customer.create({
      data: { userId: user.id },
    });

    return { customer: createdCustomer, email: user.email };
  }

  const email = normalizeCheckoutEmail(customerEmail);
  if (!email) {
    throw new Error("Enter an email address to continue checkout.");
  }

  let customerUser = await db.user.findUnique({
    where: { email },
  });

  if (!customerUser) {
    const username = await createUniqueGuestUsername(email);
    customerUser = await db.user.create({
      data: {
        email,
        username,
        role: "CUSTOMER",
      },
    });
  }

  const existingCustomer = await db.customer.findUnique({
    where: { userId: customerUser.id },
  });

  if (existingCustomer) {
    await createCustomerSession(customerUser.id);
    return { customer: existingCustomer, email };
  }

  const createdCustomer = await db.customer.create({
    data: { userId: customerUser.id },
  });

  await createCustomerSession(customerUser.id);

  return { customer: createdCustomer, email };
}
