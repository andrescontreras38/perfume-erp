import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { purchaseService } from "@/services/purchase.service";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [totalProductos, productosActivos, inventarioAgg, margenAgg, bajosStock, totalProveedores, comprasMes] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { estado: true } }),
      prisma.product.aggregate({
        _sum: { precioCosto: true },
        where: { estado: true },
      }),
      prisma.product.aggregate({
        _avg: { margen: true },
        where: { estado: true },
      }),
      prisma.product.count({
        where: { estado: true, stock: { lte: prisma.product.fields.stockMinimo } },
      }),
      prisma.supplier.count(),
      purchaseService.getMonthlyTotal(),
    ]);

  return NextResponse.json({
    data: {
      totalProductos,
      productosActivos,
      valorInventario: Number(inventarioAgg._sum.precioCosto ?? 0),
      margenPromedio:  Number(margenAgg._avg.margen ?? 0),
      bajosStock,
      totalProveedores,
      comprasMes,
    },
  });
}
