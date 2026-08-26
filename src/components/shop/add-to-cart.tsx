"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag } from "lucide-react";
import {
  addCartItem,
  isArtworkInCart,
  subscribeToCartChanges,
  type CartArtworkInput,
} from "@/lib/cart";
import { Button } from "@/components/ui/button";

type AddToCartButtonProps = {
  item?: CartArtworkInput | null;
};

export function AddToCartButton({ item }: AddToCartButtonProps) {
  const router = useRouter();
  const [inCart, setInCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const artworkId = item?.artworkId ?? "";

  useEffect(() => {
    const syncState = () => {
      if (!artworkId) {
        setInCart(false);
        return;
      }

      setInCart(isArtworkInCart(artworkId));
    };

    syncState();
    return subscribeToCartChanges(syncState);
  }, [artworkId]);

  useEffect(() => {
    if (!justAdded) {
      return;
    }

    const timer = window.setTimeout(() => {
      setJustAdded(false);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [justAdded]);

  const label = useMemo(() => {
    if (!item) {
      return "Unavailable";
    }

    if (justAdded) {
      return "Added";
    }

    return inCart ? "View cart" : "Add to cart";
  }, [inCart, item, justAdded]);

  return (
    <Button
      onClick={() => {
        if (!item) {
          return;
        }

        if (inCart) {
          router.push("/cart");
          return;
        }

        const result = addCartItem(item);
        if (result.added) {
          setJustAdded(true);
        }
      }}
      aria-label={inCart ? "View cart" : "Add this artwork to cart"}
      disabled={!item}
    >
      {justAdded ? (
        <Check className="mr-2 h-4 w-4" />
      ) : (
        <ShoppingBag className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
