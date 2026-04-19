import {
  createShopifyProduct,
  updateShopifyProduct,
  updateShopifyInventory,
  deleteShopifyProduct,
} from "@/lib/shopify";
import { prisma } from "@/lib/prisma";
import type { ProductWithRelations } from "@/types";
import { slugify } from "@/lib/utils";

export const shopifyService = {
  async createProduct(product: ProductWithRelations): Promise<void> {
    if (!process.env.SHOPIFY_ACCESS_TOKEN) return;

    const mainImage = product.images.find((i) => i.esPrincipal) ?? product.images[0];

    const shopifyProduct = await createShopifyProduct({
      title:        `${product.marca} - ${product.nombre}`,
      body_html:    product.descripcion ?? "",
      vendor:       product.marca,
      product_type: product.categoria,
      status:       product.estado ? "active" : "draft",
      variants: [
        {
          sku:                  product.sku,
          price:                product.precioVenta.toString(),
          inventory_management: "shopify",
          inventory_quantity:   product.stock,
        },
      ],
      ...(mainImage && { images: [{ src: mainImage.url }] }),
    });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        shopifyId:     shopifyProduct.id.toString(),
        shopifyHandle: shopifyProduct.handle,
      },
    });
  },

  async syncProduct(product: ProductWithRelations): Promise<void> {
    if (!product.shopifyId || !process.env.SHOPIFY_ACCESS_TOKEN) return;

    await updateShopifyProduct(product.shopifyId, {
      title:     `${product.marca} - ${product.nombre}`,
      body_html: product.descripcion ?? "",
      vendor:    product.marca,
      status:    product.estado ? "active" : "draft",
    });

    await updateShopifyInventory(product.shopifyId, product.stock);
  },

  async syncPrice(shopifyId: string, variantId: string, price: number): Promise<void> {
    if (!process.env.SHOPIFY_ACCESS_TOKEN) return;
    await updateShopifyProduct(shopifyId, {
      variants: [
        {
          sku:                  "",
          price:                price.toFixed(0),
          inventory_management: "shopify",
          inventory_quantity:   0,
        },
      ],
    });
  },

  async deleteProduct(shopifyId: string): Promise<void> {
    if (!process.env.SHOPIFY_ACCESS_TOKEN) return;
    await deleteShopifyProduct(shopifyId);
  },
};
