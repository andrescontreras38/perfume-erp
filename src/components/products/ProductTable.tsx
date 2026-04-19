"use client";

import Image from "next/image";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { formatCOP, formatMargen } from "@/lib/utils";
import type { ProductWithRelations } from "@/types";

interface ProductTableProps {
  products: ProductWithRelations[];
  onEdit: (product: ProductWithRelations) => void;
  onDelete: (product: ProductWithRelations) => void;
}

export default function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">🧴</p>
        <p className="font-medium">No se encontraron productos</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            <th className="pb-3 pr-4 font-semibold text-gray-500 w-12"></th>
            <th className="pb-3 pr-4 font-semibold text-gray-500">Producto</th>
            <th className="pb-3 pr-4 font-semibold text-gray-500">SKU</th>
            <th className="pb-3 pr-4 font-semibold text-gray-500">Categoría</th>
            <th className="pb-3 pr-4 font-semibold text-gray-500">Costo</th>
            <th className="pb-3 pr-4 font-semibold text-gray-500">Venta</th>
            <th className="pb-3 pr-4 font-semibold text-gray-500">Margen</th>
            <th className="pb-3 pr-4 font-semibold text-gray-500">Stock</th>
            <th className="pb-3 pr-4 font-semibold text-gray-500">Estado</th>
            <th className="pb-3 font-semibold text-gray-500">Shopify</th>
            <th className="pb-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {products.map((p) => {
            const mainImg = p.images.find((i) => i.esPrincipal) ?? p.images[0];
            const lowStock = p.stock <= p.stockMinimo;

            return (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 pr-4">
                  {mainImg ? (
                    <Image
                      src={mainImg.url}
                      alt={p.nombre}
                      width={40}
                      height={40}
                      className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300">🧴</div>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <Link href={`/products/${p.id}`} className="hover:text-brand-600 transition-colors">
                    <p className="font-medium text-gray-900">{p.nombre}</p>
                    <p className="text-xs text-gray-400">{p.marca}{p.tamanioMl ? ` · ${p.tamanioMl}ml` : ""}</p>
                  </Link>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-gray-500">{p.sku}</td>
                <td className="py-3 pr-4">
                  <Badge variant={p.categoria === "HOMBRE" ? "info" : p.categoria === "MUJER" ? "success" : "default"}>
                    {p.categoria}
                  </Badge>
                </td>
                <td className="py-3 pr-4 text-gray-600">{formatCOP(p.precioCosto)}</td>
                <td className="py-3 pr-4 font-medium text-gray-900">{formatCOP(p.precioVenta)}</td>
                <td className="py-3 pr-4">
                  <span className={p.margen >= 0.3 ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                    {formatMargen(p.margen)}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className={lowStock ? "text-red-600 font-medium" : "text-gray-700"}>
                    {p.stock} {lowStock && "⚠️"}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <Badge variant={p.estado ? "success" : "default"}>
                    {p.estado ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                <td className="py-3 pr-4">
                  {p.shopifyId ? (
                    <Badge variant="info">Sync</Badge>
                  ) : (
                    <Badge variant="default">Local</Badge>
                  )}
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <button onClick={() => onEdit(p)} className="text-gray-400 hover:text-brand-600 transition-colors text-lg">✏️</button>
                    <button onClick={() => onDelete(p)} className="text-gray-400 hover:text-red-500 transition-colors text-lg">🗑️</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
