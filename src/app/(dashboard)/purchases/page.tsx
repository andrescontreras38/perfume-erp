"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import PurchaseForm from "@/components/purchases/PurchaseForm";
import type { PurchaseWithRelations, SupplierWithCount } from "@/types";
import { formatCOP, formatDate } from "@/lib/utils";

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseWithRelations[]>([]);
  const [products,  setProducts]  = useState<{ id: string; sku: string; nombre: string; marca: string }[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierWithCount[]>([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [showForm,  setShowForm]  = useState(false);
  const limit = 20;

  async function load() {
    const [pRes, prodRes, supRes] = await Promise.all([
      fetch(`/api/purchases?page=${page}&limit=${limit}`),
      fetch("/api/products?limit=300"),
      fetch("/api/suppliers"),
    ]);
    const [pJson, prodJson, supJson] = await Promise.all([pRes.json(), prodRes.json(), supRes.json()]);
    setPurchases(pJson.data.items);
    setTotal(pJson.data.total);
    setProducts(prodJson.data.items.map((p: { id: string; sku: string; nombre: string; marca: string }) => ({
      id: p.id, sku: p.sku, nombre: p.nombre, marca: p.marca,
    })));
    setSuppliers(supJson.data);
  }

  useEffect(() => { load(); }, [page]);

  return (
    <div>
      <Header
        title="Compras"
        subtitle="Registro de entradas de inventario"
        actions={
          <button onClick={() => setShowForm(true)} className="btn-primary">+ Registrar compra</button>
        }
      />

      <div className="card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 font-semibold text-gray-500">Fecha</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-500">Producto</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-500">Proveedor</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-500">Cantidad</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-500">Precio unit.</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-500">Total</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-500">Notas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {purchases.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{formatDate(p.fecha)}</td>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{p.product.marca} — {p.product.nombre}</p>
                  <p className="text-xs text-gray-400">{p.product.sku}</p>
                </td>
                <td className="px-6 py-4 text-gray-700">{p.supplier.nombre}</td>
                <td className="px-6 py-4 text-gray-700">{p.cantidad}</td>
                <td className="px-6 py-4 text-gray-700">{formatCOP(p.precioCompra)}</td>
                <td className="px-6 py-4 font-semibold text-gray-900">{formatCOP(p.total)}</td>
                <td className="px-6 py-4 text-gray-400 text-xs">{p.notas ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {purchases.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🛒</p>
            <p>No hay compras registradas</p>
          </div>
        )}

        {total > limit && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Mostrando {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
            </p>
            <div className="flex gap-2">
              <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</button>
              <button className="btn-secondary" disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)}>Siguiente</button>
            </div>
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Registrar compra">
        <PurchaseForm products={products} suppliers={suppliers} onSuccess={() => { setShowForm(false); load(); }} />
      </Modal>
    </div>
  );
}
