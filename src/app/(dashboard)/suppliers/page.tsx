"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import SupplierForm from "@/components/suppliers/SupplierForm";
import type { SupplierWithCount } from "@/types";
import toast from "react-hot-toast";

export default function SuppliersPage() {
  const [suppliers,    setSuppliers]    = useState<SupplierWithCount[]>([]);
  const [editTarget,   setEditTarget]   = useState<SupplierWithCount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplierWithCount | null>(null);
  const [showCreate,   setShowCreate]   = useState(false);

  async function load() {
    const res  = await fetch("/api/suppliers");
    const json = await res.json();
    setSuppliers(json.data);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    const res  = await fetch(`/api/suppliers/${deleteTarget.id}`, { method: "DELETE" });
    const json = await res.json();
    if (res.ok) { toast.success("Proveedor eliminado"); load(); }
    else        { toast.error(json.error); }
    setDeleteTarget(null);
  }

  return (
    <div>
      <Header
        title="Proveedores"
        subtitle={`${suppliers.length} proveedores registrados`}
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary">+ Nuevo proveedor</button>
        }
      />

      <div className="card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 font-semibold text-gray-500">Nombre</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-500">Ciudad</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-500">Teléfono</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-500">Productos</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-500">Compras</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{s.nombre}</td>
                <td className="px-6 py-4 text-gray-500">{s.ciudad ?? "—"}</td>
                <td className="px-6 py-4 text-gray-500">{s.telefono ?? "—"}</td>
                <td className="px-6 py-4 text-gray-700">{s._count.products}</td>
                <td className="px-6 py-4 text-gray-700">{s._count.purchases}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => setEditTarget(s)}   className="text-gray-400 hover:text-brand-600 text-lg">✏️</button>
                    <button onClick={() => setDeleteTarget(s)} className="text-gray-400 hover:text-red-500 text-lg">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {suppliers.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🏭</p>
            <p>No hay proveedores registrados</p>
          </div>
        )}
      </div>

      <Modal open={showCreate}   onClose={() => setShowCreate(false)}   title="Nuevo proveedor">
        <SupplierForm onSuccess={() => { setShowCreate(false); load(); }} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)}   title="Editar proveedor">
        {editTarget && <SupplierForm supplier={editTarget} onSuccess={() => { setEditTarget(null); load(); }} />}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar proveedor" size="sm">
        <p className="text-sm text-gray-600 mb-6">
          ¿Confirmas eliminar <strong>{deleteTarget?.nombre}</strong>?
        </p>
        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancelar</button>
          <button className="btn-danger"    onClick={handleDelete}>Eliminar</button>
        </div>
      </Modal>
    </div>
  );
}
