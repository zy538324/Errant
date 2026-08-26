"use client";

import { useEffect } from "react";
import { clearCart } from "@/lib/cart";

export function ClearCartAfterPayment() {
  useEffect(() => {
    clearCart();
  }, []);

  return null;
}
