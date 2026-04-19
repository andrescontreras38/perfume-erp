import { prisma } from "@/lib/prisma";
import type { PurchaseFormData, PurchaseWithRelations } from "@/types";
import { Prisma } from "@prisma/client";

export const purchaseService = {
  async findMany(page = 1, limit = 20): Promise<{ items: PurchaseWithRelations[]; total: number }> {
    const [items, total] = await Promise.all([
      prisma.purchase.findMany({
        include: {
          product:  { select: { sku: true, nombre: true, marca: true } },
          supplier: { select: { nombre: true } },
        },
        orderBy: { fecha: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.purchase.count(),
    ]);

    return { items: items as unknown as PurchaseWithRelations[], total };
  },

  async create(data: PurchaseFormData): Promise<PurchaseWithRelations> {
    const total = new Prisma.Decimal(data.precioCompra).mul(data.cantidad);

    const purchase = await prisma.$transaction(async (tx) => {
      const p = await tx.purchase.create({
        data: {
          productId:    data.productId,
          supplierId:   data.supplierId,
          cantidad:     data.cantidad,
          precioCompra: data.precioCompra,
          total,
          notas:        data.notas,
          fecha:        data.fecha ? new Date(data.fecha) : undefined,
        },
        include: {
          product:  { select: { sku: true, nombre: true, marca: true } },
          supplier: { select: { nombre: true } },
        },
      });

      // Increase stock
      await tx.product.update({
        where: { id: data.productId },
        data: { stock: { increment: data.cantidad } },
      });

      // Update precioCosto to weighted average
      const product = await tx.product.findUniqueOrThrow({
        where: { id: data.productId },
        select: { stock: true, precioCosto: true },
      });

      const prevStock = product.stock - data.cantidad;
      const prevCosto = Number(product.precioCosto);
      const newCosto =
        prevStock > 0
          ? (prevCosto * prevStock + data.precioCompra * data.cantidad) / product.stock
          : data.precioCompra;

      await tx.product.update({
        where: { id: data.productId },
        data: { precioCosto: newCosto },
      });

      return p;
    });

    return purchase as unknown as PurchaseWithRelations;
  },

  async getMonthlyTotal(): Promise<number> {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const result = await prisma.purchase.aggregate({
      _sum: { total: true },
      where: { fecha: { gte: start } },
    });

    return Number(result._sum.total ?? 0);
  },
};
