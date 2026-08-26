import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyCustomerLoginCode } from "@/lib/customer-login";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(req: Request) {
  try {
    const payload = verifySchema.parse(await req.json());
    await verifyCustomerLoginCode(payload);

    return NextResponse.json({
      success: true,
      redirectTo: "/account/downloads",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify login code.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
