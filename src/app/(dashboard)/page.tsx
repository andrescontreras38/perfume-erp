import Header from "@/components/layout/Header";
import MetricCard from "@/components/dashboard/MetricCard";
import { prisma } from "@/lib/prisma";
import { purchaseService } from "@/services/purchase.service";
import { formatCOP, formatMargen } from "@/lib/utils";

async function getMetrics() {
  const [totalProductos, productosActivos, inventarioAgg, margenAgg, totalProveedores, comprasMes] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { estado: true } }),
      prisma.product.aggregate({ _sum: { precioCosto: true }, where: { estado: true } }),
      prisma.product.aggregate({ _avg: { margen: true }, where: { estado: true } }),
      prisma.supplier.count(),
      purchaseService.getMonthlyTotal(),
    ]);

  const bajosStock = await prisma.product.findMany({
    where: { estado: true },
    select: { stock: true, stockMinimo: true },
  }).then((ps) => ps.filter((p) => p.stock <= p.stockMinimo).length);

  return {
    totalProductos,
    productosActivos,
    valorInventario: Number(inventarioAgg._sum.precioCosto ?? 0),
    margenPromedio:  Number(margenAgg._avg.margen ?? 0),
    bajosStock,
    totalProveedores,
    comprasMes,
  };
}

async function getLowStockProducts() {
  const products = await prisma.product.findMany({
    where: { estado: true },
    select: { id: true, nombre: true, marca: true, sku: true, stock: true, stockMinimo: true },
  });
  return products.filter((p) => p.stock <= p.stockMinimo).slice(0, 8);
}

export default async function DashboardPage() {
  const [metrics, lowStock] = await Promise.all([getMetrics(), getLowStockProducts()]);

  return (
    <div>
      <Header title="Dashboard" subtitle="Resumen del inventario" />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total productos"     value={metrics.totalProductos}           icon="🧴" />
        <MetricCard label="Valor inventario"    value={formatCOP(metrics.valorInventario)} icon="💰" variant="success" />
        <MetricCard label="Margen promedio"     value={formatMargen(metrics.margenPromedio)} icon="📈" />
        <MetricCard label="Bajo stock"          value={metrics.bajosStock}               icon="⚠️" variant={metrics.bajosStock > 0 ? "warning" : "default"} />
        <MetricCard label="Productos activos"   value={metrics.productosActivos}          icon="✅" />
        <MetricCard label="Proveedores"         value={metrics.totalProveedores}          icon="🏭" />
        <MetricCard label="Compras este mes"    value={formatCOP(metrics.comprasMes)}     icon="🛒" />
      </div>

      {lowStock.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">⚠️ Productos con bajo stock</h2>
          <div className="space-y-2">
            {lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <span className="font-medium text-sm text-gray-900">{p.marca} – {p.nombre}</span>
                  <span className="text-xs text-gray-400 ml-2">({p.sku})</span>
                </div>
                <div className="text-sm">
                  <span className="text-red-600 font-bold">{p.stock}</span>
                  <span className="text-gray-400"> / mín {p.stockMinimo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
