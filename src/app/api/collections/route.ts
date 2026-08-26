import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const collections = await db.collection.findMany({
    include: {
      artworks: {
        where: { status: "PUBLISHED" },
        select: { id: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ collections });
}
