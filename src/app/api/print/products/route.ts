import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Print-on-demand is intentionally disabled for this launch.
// Keep this route as a safe no-op so any stale client calls cannot expose or sell print products.
export async function GET() {
  return NextResponse.json(
    {
      products: [],
      message: "Print products are not currently available.",
    },
    { status: 200 },
  );
}
