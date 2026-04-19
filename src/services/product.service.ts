import { prisma } from "@/lib/prisma";
import { calcMargen } from "@/lib/utils";
import { shopifyService } from "./shopify.service";
import type { ProductFormData, ProductWithRelations } from "@/types";
import { Categoria, Prisma } from "@prisma/client";

export interface ProductFilters {
  search?: string;
  categoria?: Categoria;
  supplierId?: string;
  bajoStock?: boolean;
  estado?: boolean;
  orderBy?: "nombre" | "margen" | "stock" | "precioVenta" | "createdAt";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

const PRODUCT_INCLUDE = {
  suppliers: {
    include: { supplier: { select: { id: true, nombre: true, ciudad: true } } },
    orderBy: { esPrincipal: "desc" as const },
  },
  images: { orderBy: [{ esPrincipal: "desc" as const }, { orden: "asc" as const }] },
} satisfies Prisma.ProductInclude;

export const productService = {
  async findMany(filters: ProductFilters = {}) {
    const {
      search,
      categoria,
      supplierId,
      bajoStock,
      estado,
      orderBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 20,
    } = filters;

    const where: Prisma.ProductWhereInput = {
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: "insensitive" } },
          { marca: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(categoria && { categoria }),
      ...(estado !== undefined && { estado }),
      ...(bajoStock && { stock: { lte: prisma.product.fields.stockMinimo } }),
      ...(supplierId && {
        suppliers: { some: { supplierId } },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy: { [orderBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return { items: items as unknown as ProductWithRelations[], total, page, limit };
  },

  async findById(id: string): Promise<ProductWithRelations | null> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });
    return product as unknown as ProductWithRelations | null;
  },

  async create(data: ProductFormData): Promise<ProductWithRelations> {
    const margen = calcMargen(data.precioCosto, data.precioVenta);

    const product = await prisma.product.create({
      data: {
        sku:         data.sku,
        nombre:      data.nombre,
        marca:       data.marca,
        descripcion: data.descripcion,
        categoria:   data.categoria,
        tamanioMl:   data.tamanioMl,
        precioCosto: data.precioCosto,
        precioVenta: data.precioVenta,
        margen,
        stock:       data.stock,
        stockMinimo: data.stockMinimo,
        estado:      data.estado,
        suppliers: {
          create: data.suppliers.map((s) => ({
            supplierId:   s.supplierId,
            precioCompra: s.precioCompra,
            esPrincipal:  s.esPrincipal,
          })),
        },
      },
      include: PRODUCT_INCLUDE,
    });

    // Sync to Shopify asynchronously (non-blocking)
    shopifyService.createProduct(product as unknown as ProductWithRelations).catch(console.error);

    return product as unknown as ProductWithRelations;
  },

  async update(id: string, data: Partial<ProductFormData>): Promise<ProductWithRelations> {
    const current = await prisma.product.findUniqueOrThrow({ where: { id } });

    const precioCosto = data.precioCosto ?? Number(current.precioCosto);
    const precioVenta = data.precioVenta ?? Number(current.precioVenta);
    const margen = calcMargen(precioCosto, precioVenta);

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.sku         !== undefined && { sku: data.sku }),
        ...(data.nombre      !== undefined && { nombre: data.nombre }),
        ...(data.marca       !== undefined && { marca: data.marca }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
        ...(data.categoria   !== undefined && { categoria: data.categoria }),
        ...(data.tamanioMl   !== undefined && { tamanioMl: data.tamanioMl }),
        ...(data.stock       !== undefined && { stock: data.stock }),
        ...(data.stockMinimo !== undefined && { stockMinimo: data.stockMinimo }),
        ...(data.estado      !== undefined && { estado: data.estado }),
        precioCosto,
        precioVenta,
        margen,
        ...(data.suppliers && {
          suppliers: {
            deleteMany: {},
            create: data.suppliers.map((s) => ({
              supplierId:   s.supplierId,
              precioCompra: s.precioCompra,
              esPrincipal:  s.esPrincipal,
            })),
          },
        }),
      },
      include: PRODUCT_INCLUDE,
    });

    // Sync price/stock to Shopify
    if (current.shopifyId) {
      shopifyService.syncProduct(product as unknown as ProductWithRelations).catch(console.error);
    }

    return product as unknown as ProductWithRelations;
  },

  async delete(id: string): Promise<void> {
    const product = await prisma.product.findUniqueOrThrow({ where: { id } });

    await prisma.product.delete({ where: { id } });

    if (product.shopifyId) {
      shopifyService.deleteProduct(product.shopifyId).catch(console.error);
    }
  },

  async getLowStockProducts() {
    return prisma.product.findMany({
      where: {
        estado: true,
        stock: { lte: prisma.product.fields.stockMinimo },
      },
      include: { images: { where: { esPrincipal: true }, take: 1 } },
      orderBy: { stock: "asc" },
      take: 10,
    });
  },
};
