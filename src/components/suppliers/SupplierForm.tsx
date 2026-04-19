"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useState } from "react";
import type { SupplierWithCount } from "@/types";

const schema = z.object({
  nombre:   z.string().min(1, "Nombre requerido"),
  telefono: z.string().optional(),
  ciudad:   z.string().optional(),
  notas:    z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface SupplierFormProps {
  supplier?: SupplierWithCount;
  onSuccess: () => void;
}

export default function SupplierForm({ supplier, onSuccess }: SupplierFormProps) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: supplier
      ? { nombre: supplier.nombre, telefono: supplier.telefono ?? "", ciudad: supplier.ciudad ?? "", notas: supplier.notas ?? "" }
      : { nombre: "", telefono: "", ciudad: "", notas: "" },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    const url    = supplier ? `/api/suppliers/${supplier.id}` : "/api/suppliers";
    const method = supplier ? "PATCH" : "POST";

    const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await res.json();

    if (!res.ok) { toast.error(json.error ?? "Error"); } else { toast.success(json.message); onSuccess(); }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Nombre *</label>
        <input className="input" {...register("nombre")} />
        {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Teléfono</label>
          <input className="input" {...register("telefono")} />
        </div>
        <div>
          <label className="label">Ciudad</label>
          <input className="input" {...register("ciudad")} />
        </div>
      </div>
      <div>
        <label className="label">Notas</label>
        <textarea className="input h-20 resize-none" {...register("notas")} />
      </div>
      <div className="flex justify-end pt-1">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Guardando..." : supplier ? "Guardar cambios" : "Crear proveedor"}
        </button>
      </div>
    </form>
  );
}
