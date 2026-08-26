import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  CHECKOUT_ATTEMPT_COOKIE,
  CHECKOUT_EXPIRED_MESSAGE,
  CHECKOUT_EXPIRY_SECONDS,
  createCheckoutAttemptToken,
  verifyCheckoutAttemptToken,
} from "@/lib/checkout-expiry";

function setCheckoutAttemptCookie(token: string) {
  return {
    name: CHECKOUT_ATTEMPT_COOKIE,
    value: token,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60,
    },
  };
}

async function createAttemptResponse() {
  const attempt = createCheckoutAttemptToken();
  const response = NextResponse.json({
    status: "active",
    token: attempt.token,
    issuedAt: attempt.issuedAt,
    expiresAt: attempt.expiresAt,
    expiresInSeconds: CHECKOUT_EXPIRY_SECONDS,
  });
  const cookie = setCheckoutAttemptCookie(attempt.token);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { restart?: boolean } | null;

  if (body?.restart) {
    return createAttemptResponse();
  }

  const cookieStore = await cookies();
  const existingToken = cookieStore.get(CHECKOUT_ATTEMPT_COOKIE)?.value;

  if (!existingToken) {
    return createAttemptResponse();
  }

  try {
    const attempt = verifyCheckoutAttemptToken(existingToken);
    return NextResponse.json({
      status: "active",
      token: existingToken,
      issuedAt: attempt.issuedAt,
      expiresAt: attempt.expiresAt,
      expiresInSeconds: Math.max(
        0,
        attempt.expiresAt - Math.floor(Date.now() / 1000),
      ),
    });
  } catch {
    return NextResponse.json(
      {
        status: "expired",
        error: CHECKOUT_EXPIRED_MESSAGE,
      },
      { status: 409 },
    );
  }
}
