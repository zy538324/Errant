import { NextResponse } from "next/server";

// Print-on-demand is intentionally disabled for this launch.
// Keep this route as a safe no-op so no physical print orders can be created early.
export async function POST() {
  return NextResponse.json(
    { error: "Print orders are not currently available." },
    { status: 403 },
  );
}
