import { NextResponse } from "next/server";
import { destroyCustomerSession } from "@/lib/session";

export async function POST() {
  await destroyCustomerSession();
  return NextResponse.json({ success: true });
}

