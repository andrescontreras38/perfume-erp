"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Categoria } from "@prisma/client";
import toast from "react-hot-toast";
import type { ProductWithRelations, SupplierWithCount } from "@/types";
import { formatMargen, calcMargen } from "@/lib/utils";
import { useState, useEffect } from "react";

const schema = z
  .object({
    sku:         z.string().min(1, "SKU requerido"),
    nombre:      z.string().min(1, "Nombre requerido"),
    marca:       z.string().min(1, "Marca requerida"),
    descripcion: z.string().optional(),
    categoria:   z.nativeEnum(Categoria),
    tamanioMl:   z.coerce.number().int().positive().optional().or(z.literal("")),
    precioCosto: z.coerce.number().nonnegative("Debe ser positivo"),
    precioVenta: z.coerce.number().positive("Debe ser positivo"),
    stock:       z.coerce.number().int().nonnegative(),
    stockMinimo: z.coerce.number().int().nonnegative(),
    estado:      z.boolean(),
  })
  .refine((d) => d.precioVenta > d.precioCosto, {
    message: "El precio de venta debe ser mayor al costo",
    path: ["precioVenta"],
  });

type FormData = z.infer<typeof schema>;

interface ProductFormProps {
  product?: ProductWithRelations;
  suppliers: SupplierWithCount[];
  onSuccess: () => void;
}

export default function ProductForm({ product, suppliers, onSuccess }: ProductFormProps) {
  const isEdit = !!product;
  const [loading, setLoading] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState<
    { supplierId: string; precioCompra: number; esPrincipal: boolean }[]
  >(product?.suppliers.map((s) => ({ supplierId: s.supplierId, precioCompra: s.precioCompra, esPrincipal: s.esPrincipal })) ?? []);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: product
      ? {
          sku:         product.sku,
          nombre:      product.nombre,
          marca:       product.marca,
          descripcion: product.descripcion ?? "",
          categoria:   product.categoria,
          tamanioMl:   product.tamanioMl ?? undefined,
          precioCosto: product.precioCosto,
          precioVenta: product.precioVenta,
          stock:       product.stock,
          stockMinimo: product.stockMinimo,
          estado:      product.estado,
        }
      : { categoria: Categoria.UNISEX, estado: true, stockMinimo: 5, stock: 0, precioCosto: 0, precioVenta: 0 },
  });

  const precioCosto = watch("precioCosto");
  const precioVenta = watch("precioVenta");
  const margen = calcMargen(Number(precioCosto), Number(precioVenta));

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const url    = isEdit ? `/api/products/${product.id}` : "/api/products";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, suppliers: selectedSuppliers }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Error al guardar");
        return;
      }
      toast.success(json.message ?? "Guardado");
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  function addSupplier() {
    if (suppliers.length === 0) return;
    setSelectedSuppliers((prev) => [
      ...prev,
      { supplierId: suppliers[0].id, precioCompra: 0, esPrincipal: prev.length === 0 },
    ]);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Basic info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">SKU *</label>
          <input className="input" {...register("sku")} />
          {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku.message}</p>}
        </div>
        <div>
          <label className="label">Categoría *</label>
          <select className="input" {...register("categoria")}>
            {Object.values(Categoria).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Nombre *</label>
          <input className="input" {...register("nombre")} />
          {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre.message}</p>}
        </div>
        <div>
          <label className="label">Marca *</label>
          <input className="input" {...register("marca")} />
          {errors.marca && <p className="text-xs text-red-500 mt-1">{errors.marca.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">Descripción</label>
        <textarea className="input h-20 resize-none" {...register("descripcion")} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Tamaño (ml)</label>
          <input type="number" className="input" {...register("tamanioMl")} />
        </div>
        <div>
          <label className="label">Stock</label>
          <input type="number" className="input" {...register("stock")} />
        </div>
        <div>
          <label className="label">Stock mínimo</label>
          <input type="number" className="input" {...register("stockMinimo")} />
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Precio costo (COP)</label>
          <input type="number" className="input" {...register("precioCosto")} />
          {errors.precioCosto && <p className="text-xs text-red-500 mt-1">{errors.precioCosto.message}</p>}
        </div>
        <div>
          <label className="label">Precio venta (COP)</label>
          <input type="number" className="input" {...register("precioVenta")} />
          {errors.precioVenta && <p className="text-xs text-red-500 mt-1">{errors.precioVenta.message}</p>}
        </div>
        <div>
          <label className="label">Margen</label>
          <div className={`input flex items-center font-medium ${margen >= 0.3 ? "text-green-600" : "text-amber-600"}`}>
            {formatMargen(margen)}
          </div>
        </div>
      </div>

      {/* Estado */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" className="rounded" {...register("estado")} />
        <span className="text-sm font-medium text-gray-700">Producto activo</span>
      </label>

      {/* Suppliers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Proveedores</label>
          <button type="button" onClick={addSupplier} className="text-xs text-brand-600 hover:underline">
            + Agregar proveedor
          </button>
        </div>
        <div className="space-y-2">
          {selectedSuppliers.map((s, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select
                className="input flex-1"
                value={s.supplierId}
                onChange={(e) => setSelectedSuppliers((prev) =>
                  prev.map((x, j) => (j === i ? { ...x, supplierId: e.target.value } : x))
                )}
              >
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>{sup.nombre}</option>
                ))}
              </select>
              <input
                type="number"
                className="input w-36"
                placeholder="Precio compra"
                value={s.precioCompra}
                onChange={(e) => setSelectedSuppliers((prev) =>
                  prev.map((x, j) => (j === i ? { ...x, precioCompra: Number(e.target.value) } : x))
                )}
              />
              <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                <input
                  type="radio"
                  name="principal"
                  checked={s.esPrincipal}
                  onChange={() => setSelectedSuppliers((prev) =>
                    prev.map((x, j) => ({ ...x, esPrincipal: j === i }))
                  )}
                />
                Principal
              </label>
              <button
                type="button"
                onClick={() => setSelectedSuppliers((prev) => prev.filter((_, j) => j !== i))}
                className="text-red-400 hover:text-red-600 text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
        </button>
      </div>
    </form>
  );
}
