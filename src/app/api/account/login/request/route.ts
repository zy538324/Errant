import { NextResponse } from "next/server";
import { z } from "zod";
import { requestCustomerLoginCode } from "@/lib/customer-login";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const payload = requestSchema.parse(await req.json());
    await requestCustomerLoginCode(req, payload.email);

    return NextResponse.json({
      success: true,
      message:
        "If that email has purchases with Errant Arts, a 6-digit login code has been sent.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to request a login code.";
    const status = message.includes("Too many") ? 429 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
