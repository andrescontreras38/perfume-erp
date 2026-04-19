"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useState } from "react";
import type { ProductWithRelations, SupplierWithCount } from "@/types";
import { formatCOP } from "@/lib/utils";

const schema = z.object({
  productId:    z.string().min(1),
  supplierId:   z.string().min(1),
  cantidad:     z.coerce.number().int().positive(),
  precioCompra: z.coerce.number().positive(),
  notas:        z.string().optional(),
  fecha:        z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface PurchaseFormProps {
  products:  { id: string; sku: string; nombre: string; marca: string }[];
  suppliers: SupplierWithCount[];
  onSuccess: () => void;
}

export default function PurchaseForm({ products, suppliers, onSuccess }: PurchaseFormProps) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { cantidad: 1, fecha: new Date().toISOString().split("T")[0] },
  });

  const cantidad     = watch("cantidad");
  const precioCompra = watch("precioCompra");
  const total        = (cantidad ?? 0) * (precioCompra ?? 0);

  async function onSubmit(data: FormData) {
    setLoading(true);
    const res  = await fetch("/api/purchases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await res.json();

    if (!res.ok) { toast.error(json.error ?? "Error"); } else { toast.success(json.message); onSuccess(); }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Producto *</label>
        <select className="input" {...register("productId")}>
          <option value="">Seleccionar producto</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.marca} — {p.nombre} ({p.sku})</option>
          ))}
        </select>
        {errors.productId && <p className="text-xs text-red-500 mt-1">Requerido</p>}
      </div>

      <div>
        <label className="label">Proveedor *</label>
        <select className="input" {...register("supplierId")}>
          <option value="">Seleccionar proveedor</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.nombre}{s.ciudad ? ` · ${s.ciudad}` : ""}</option>
          ))}
        </select>
        {errors.supplierId && <p className="text-xs text-red-500 mt-1">Requerido</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Cantidad *</label>
          <input type="number" className="input" {...register("cantidad")} />
          {errors.cantidad && <p className="text-xs text-red-500 mt-1">{errors.cantidad.message}</p>}
        </div>
        <div>
          <label className="label">Precio compra (COP) *</label>
          <input type="number" className="input" {...register("precioCompra")} />
          {errors.precioCompra && <p className="text-xs text-red-500 mt-1">{errors.precioCompra.message}</p>}
        </div>
      </div>

      {total > 0 && (
        <div className="bg-brand-50 rounded-lg px-4 py-3 text-sm">
          <span className="text-gray-600">Total compra: </span>
          <span className="font-bold text-brand-700">{formatCOP(total)}</span>
        </div>
      )}

      <div>
        <label className="label">Fecha</label>
        <input type="date" className="input" {...register("fecha")} />
      </div>

      <div>
        <label className="label">Notas</label>
        <textarea className="input h-16 resize-none" {...register("notas")} />
      </div>

      <div className="flex justify-end pt-1">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Registrando..." : "Registrar compra"}
        </button>
      </div>
    </form>
  );
}
