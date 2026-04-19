import { prisma } from "@/lib/prisma";
import type { SupplierFormData, SupplierWithCount } from "@/types";

export const supplierService = {
  async findMany(): Promise<SupplierWithCount[]> {
    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: { select: { products: true, purchases: true } },
      },
      orderBy: { nombre: "asc" },
    });
    return suppliers as unknown as SupplierWithCount[];
  },

  async findById(id: string) {
    return prisma.supplier.findUnique({
      where: { id },
      include: {
        products: {
          include: { product: { select: { id: true, sku: true, nombre: true, marca: true, stock: true } } },
        },
        _count: { select: { purchases: true } },
      },
    });
  },

  async create(data: SupplierFormData) {
    return prisma.supplier.create({ data });
  },

  async update(id: string, data: Partial<SupplierFormData>) {
    return prisma.supplier.update({ where: { id }, data });
  },

  async delete(id: string): Promise<void> {
    const count = await prisma.productSupplier.count({ where: { supplierId: id } });
    if (count > 0) {
      throw new Error("No se puede eliminar un proveedor con productos asociados.");
    }
    await prisma.supplier.delete({ where: { id } });
  },
};
