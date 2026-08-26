import { db } from "@/lib/db";

export async function createPendingOrder(customerId: string, artworkIds: string[]) {
  return db.$transaction(async (tx) => {
    const artworks = await tx.artwork.findMany({
      where: { id: { in: artworkIds }, status: "PUBLISHED" },
      select: { id: true, pricePence: true, stockOnHand: true },
    });

    if (artworks.length !== artworkIds.length) {
      throw new Error("One or more artworks are unavailable for purchase.");
    }

    const artworkById = new Map(artworks.map((artwork) => [artwork.id, artwork] as const));

    for (const artworkId of artworkIds) {
      const artwork = artworkById.get(artworkId);
      if (!artwork) {
        throw new Error("One or more artworks are unavailable for purchase.");
      }

      if (typeof artwork.stockOnHand !== "number") {
        continue;
      }

      if (artwork.stockOnHand <= 0) {
        throw new Error("One or more artworks are sold out.");
      }

      const decremented = await tx.artwork.updateMany({
        where: {
          id: artworkId,
          status: "PUBLISHED",
          stockOnHand: { gte: 1 },
        },
        data: {
          stockOnHand: { decrement: 1 },
        },
      });

      if (decremented.count !== 1) {
        throw new Error("One or more artworks are sold out.");
      }
    }

    return tx.order.create({
      data: {
        customerId,
        totalPence: artworkIds.reduce((sum, artworkId) => {
          const artwork = artworkById.get(artworkId);
          return sum + (artwork?.pricePence ?? 0);
        }, 0),
        items: {
          create: artworkIds.map((artworkId) => {
            const artwork = artworkById.get(artworkId);
            if (!artwork) {
              throw new Error("One or more artworks are unavailable for purchase.");
            }

            return {
              artworkId: artwork.id,
              unitPence: artwork.pricePence,
              quantity: 1,
            };
          }),
        },
      },
      include: { items: true },
    });
  });
}
