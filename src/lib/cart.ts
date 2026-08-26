export const CART_STORAGE_KEY = "errant-arts.cart.v1";
export const CART_UPDATED_EVENT = "errant-arts:cart-updated";
const CART_ITEM_LIMIT = 20;

export type CartArtworkInput = {
  artworkId: string;
  slug: string;
  title: string;
  pricePence: number;
  imageUrl: string | null;
};

export type CartItem = CartArtworkInput & {
  quantity: number;
};

type StoredCartShape = {
  items: CartItem[];
};

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizePrice(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value));
}

function normalizeQuantity(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 1;
  }

  const safeQuantity = Math.floor(value);
  return Math.max(1, Math.min(10, safeQuantity));
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCartItem(value: unknown): CartItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const artworkId = normalizeText(record.artworkId);
  const slug = normalizeText(record.slug);
  const title = normalizeText(record.title);

  if (!artworkId || !slug || !title) {
    return null;
  }

  const imageUrlRaw = record.imageUrl;
  const imageUrl =
    typeof imageUrlRaw === "string" && imageUrlRaw.trim().length > 0
      ? imageUrlRaw
      : null;

  return {
    artworkId,
    slug,
    title,
    pricePence: normalizePrice(record.pricePence),
    imageUrl,
    quantity: normalizeQuantity(record.quantity),
  };
}

function parseStoredCart(rawValue: string | null): CartItem[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    const values = Array.isArray(parsed)
      ? parsed
      : (parsed as StoredCartShape | null)?.items;

    if (!Array.isArray(values)) {
      return [];
    }

    return values
      .map(normalizeCartItem)
      .filter((item): item is CartItem => Boolean(item))
      .slice(0, CART_ITEM_LIMIT);
  } catch {
    return [];
  }
}

function emitCartUpdated() {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function readCart() {
  if (!isBrowser()) {
    return [] as CartItem[];
  }

  return parseStoredCart(window.localStorage.getItem(CART_STORAGE_KEY));
}

export function writeCart(items: CartItem[]) {
  if (!isBrowser()) {
    return;
  }

  const normalizedItems = items
    .map(normalizeCartItem)
    .filter((item): item is CartItem => Boolean(item))
    .slice(0, CART_ITEM_LIMIT);

  const payload: StoredCartShape = { items: normalizedItems };
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
  emitCartUpdated();
}

export function addCartItem(item: CartArtworkInput) {
  const normalizedItem = normalizeCartItem({ ...item, quantity: 1 });
  if (!normalizedItem) {
    return { added: false, items: readCart() };
  }

  const currentItems = readCart();
  const alreadyInCart = currentItems.some(
    (currentItem) => currentItem.artworkId === normalizedItem.artworkId,
  );

  if (alreadyInCart || currentItems.length >= CART_ITEM_LIMIT) {
    return { added: false, items: currentItems };
  }

  const nextItems = [...currentItems, normalizedItem];
  writeCart(nextItems);
  return { added: true, items: nextItems };
}

export function removeCartItem(artworkId: string) {
  const currentItems = readCart();
  const nextItems = currentItems.filter((item) => item.artworkId !== artworkId);
  writeCart(nextItems);
  return nextItems;
}

export function clearCart() {
  writeCart([]);
}

export function isArtworkInCart(artworkId: string) {
  return readCart().some((item) => item.artworkId === artworkId);
}

export function getCartItemCount(items: CartItem[] = readCart()) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartSubtotalPence(items: CartItem[] = readCart()) {
  return items.reduce((sum, item) => sum + item.pricePence * item.quantity, 0);
}

export function subscribeToCartChanges(listener: () => void) {
  if (!isBrowser()) {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === CART_STORAGE_KEY) {
      listener();
    }
  };
  const handleCartUpdate = () => listener();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(CART_UPDATED_EVENT, handleCartUpdate);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdate);
  };
}
