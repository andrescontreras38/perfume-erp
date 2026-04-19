"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import ProductTable from "@/components/products/ProductTable";
import ProductForm from "@/components/products/ProductForm";
import Modal from "@/components/ui/Modal";
import toast from "react-hot-toast";
import type { ProductWithRelations, SupplierWithCount } from "@/types";
import { Categoria } from "@prisma/client";

export default function ProductsPage() {
  const [products,  setProducts]  = useState<ProductWithRelations[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierWithCount[]>([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [categoria, setCategoria] = useState("");
  const [editTarget,   setEditTarget]   = useState<ProductWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductWithRelations | null>(null);
  const [showCreate,   setShowCreate]   = useState(false);

  const limit = 20;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(search    && { search }),
      ...(categoria && { categoria }),
    });
    const res  = await fetch(`/api/products?${params}`);
    const json = await res.json();
    setProducts(json.data.items);
    setTotal(json.data.total);
    setLoading(false);
  }, [page, search, categoria]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    fetch("/api/suppliers").then((r) => r.json()).then((j) => setSuppliers(j.data));
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/products/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Producto eliminado"); fetchProducts(); }
    setDeleteTarget(null);
  }

  return (
    <div>
      <Header
        title="Productos"
        subtitle={`${total} perfumes en inventario`}
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            + Nuevo producto
          </button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <input
          className="input max-w-xs"
          placeholder="Buscar por nombre, marca o SKU..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select className="input w-40" value={categoria} onChange={(e) => { setCategoria(e.target.value); setPage(1); }}>
          <option value="">Todas</option>
          {Object.values(Categoria).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : (
          <ProductTable
            products={products}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
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

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo producto" size="lg">
        <ProductForm suppliers={suppliers} onSuccess={() => { setShowCreate(false); fetchProducts(); }} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Editar producto" size="lg">
        {editTarget && (
          <ProductForm product={editTarget} suppliers={suppliers} onSuccess={() => { setEditTarget(null); fetchProducts(); }} />
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar producto" size="sm">
        <p className="text-sm text-gray-600 mb-6">
          ¿Confirmas eliminar <strong>{deleteTarget?.nombre}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancelar</button>
          <button className="btn-danger" onClick={handleDelete}>Eliminar</button>
        </div>
      </Modal>
    </div>
  );
}
