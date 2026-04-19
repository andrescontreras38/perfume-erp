const SHOPIFY_BASE = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${process.env.SHOPIFY_API_VERSION}`;

async function shopifyFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${SHOPIFY_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN!,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Shopify API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  status: "active" | "draft" | "archived";
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

export interface ShopifyVariant {
  id: number;
  price: string;
  inventory_quantity: number;
  inventory_management: string;
  sku: string;
}

export interface ShopifyImage {
  id: number;
  src: string;
  position: number;
}

interface ShopifyProductPayload {
  title: string;
  body_html?: string;
  vendor: string;
  product_type: string;
  status: "active" | "draft";
  variants: {
    sku: string;
    price: string;
    inventory_management: "shopify";
    inventory_quantity: number;
  }[];
  images?: { src: string }[];
}

export async function createShopifyProduct(
  payload: ShopifyProductPayload
): Promise<ShopifyProduct> {
  const { product } = await shopifyFetch<{ product: ShopifyProduct }>(
    "/products.json",
    { method: "POST", body: JSON.stringify({ product: payload }) }
  );
  return product;
}

export async function updateShopifyProduct(
  shopifyId: string,
  payload: Partial<ShopifyProductPayload>
): Promise<ShopifyProduct> {
  const { product } = await shopifyFetch<{ product: ShopifyProduct }>(
    `/products/${shopifyId}.json`,
    { method: "PUT", body: JSON.stringify({ product: payload }) }
  );
  return product;
}

export async function updateShopifyVariantPrice(
  variantId: string,
  price: number
): Promise<void> {
  await shopifyFetch(`/variants/${variantId}.json`, {
    method: "PUT",
    body: JSON.stringify({ variant: { id: variantId, price: price.toFixed(0) } }),
  });
}

export async function updateShopifyInventory(
  shopifyId: string,
  quantity: number
): Promise<void> {
  const { product } = await shopifyFetch<{ product: ShopifyProduct }>(
    `/products/${shopifyId}.json`
  );

  const variantId = product.variants[0]?.id;
  if (!variantId) return;

  // Get inventory item id
  const { variant } = await shopifyFetch<{ variant: { inventory_item_id: number } }>(
    `/variants/${variantId}.json`
  );

  // Get location id
  const { locations } = await shopifyFetch<{ locations: { id: number }[] }>(
    "/locations.json"
  );
  const locationId = locations[0]?.id;
  if (!locationId) return;

  await shopifyFetch("/inventory_levels/set.json", {
    method: "POST",
    body: JSON.stringify({
      location_id: locationId,
      inventory_item_id: variant.inventory_item_id,
      available: quantity,
    }),
  });
}

export async function deleteShopifyProduct(shopifyId: string): Promise<void> {
  await shopifyFetch(`/products/${shopifyId}.json`, { method: "DELETE" });
}
