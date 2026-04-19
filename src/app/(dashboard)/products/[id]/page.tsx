"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import ImageUploader from "@/components/products/ImageUploader";
import ProductForm from "@/components/products/ProductForm";
import Modal from "@/components/ui/Modal";
import { formatCOP, formatMargen, formatDate } from "@/lib/utils";
import type { ProductWithRelations, SupplierWithCount } from "@/types";
import toast from "react-hot-toast";

interface Props { params: Promise<{ id: string }> }

export default function ProductDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [product,   setProduct]   = useState<ProductWithRelations | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierWithCount[]>([]);
  const [showEdit,  setShowEdit]  = useState(false);

  async function load() {
    const [pRes, sRes] = await Promise.all([fetch(`/api/products/${id}`), fetch("/api/suppliers")]);
    const [pJson, sJson] = await Promise.all([pRes.json(), sRes.json()]);
    setProduct(pJson.data);
    setSuppliers(sJson.data);
  }

  useEffect(() => { load(); }, [id]);

  if (!product) return <div className="text-center py-20 text-gray-400">Cargando...</div>;

  const mainImg  = product.images.find((i) => i.esPrincipal) ?? product.images[0];
  const lowStock = product.stock <= product.stockMinimo;

  return (
    <div>
      <div className="mb-4">
        <Link href="/products" className="text-sm text-gray-500 hover:text-brand-600">← Volver a productos</Link>
      </div>

      <Header
        title={`${product.marca} — ${product.nombre}`}
        subtitle={product.sku}
        actions={
          <button onClick={() => setShowEdit(true)} className="btn-primary">Editar producto</button>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        {/* Left: images */}
        <div className="col-span-1 space-y-4">
          <div className="card p-4">
            {mainImg ? (
              <Image src={mainImg.url} alt={product.nombre} width={400} height={400} className="w-full aspect-square object-cover rounded-lg" />
            ) : (
              <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-6xl">🧴</div>
            )}
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">Imágenes del producto</h3>
            <ImageUploader productId={product.id} images={product.images} onUpdate={load} />
          </div>
        </div>

        {/* Right: details */}
        <div className="col-span-2 space-y-5">
          {/* Status & category */}
          <div className="card p-5 flex gap-4">
            <Badge variant={product.estado ? "success" : "default"}>{product.estado ? "Activo" : "Inactivo"}</Badge>
            <Badge variant="info">{product.categoria}</Badge>
            {product.tamanioMl && <Badge variant="default">{product.tamanioMl} ml</Badge>}
            {product.shopifyId && <Badge variant="info">Shopify ✓</Badge>}
            {lowStock && <Badge variant="warning">⚠️ Bajo stock</Badge>}
          </div>

          {/* Pricing */}
          <div className="card p-5">
            <h3 className="font-semibold text-sm text-gray-700 mb-4">Precios</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400">Precio costo</p>
                <p className="text-xl font-bold text-gray-900">{formatCOP(product.precioCosto)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Precio venta</p>
                <p className="text-xl font-bold text-gray-900">{formatCOP(product.precioVenta)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Margen</p>
                <p className={`text-xl font-bold ${product.margen >= 0.3 ? "text-green-600" : "text-amber-600"}`}>
                  {formatMargen(product.margen)}
                </p>
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className="card p-5">
            <h3 className="font-semibold text-sm text-gray-700 mb-4">Inventario</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400">Stock actual</p>
                <p className={`text-2xl font-bold ${lowStock ? "text-red-600" : "text-gray-900"}`}>{product.stock}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Stock mínimo</p>
                <p className="text-2xl font-bold text-gray-500">{product.stockMinimo}</p>
              </div>
            </div>
          </div>

          {/* Suppliers */}
          {product.suppliers.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-sm text-gray-700 mb-3">Proveedores</h3>
              <div className="space-y-2">
                {product.suppliers.map((ps) => (
                  <div key={ps.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{ps.supplier.nombre}</span>
                      {ps.supplier.ciudad && <span className="text-xs text-gray-400">{ps.supplier.ciudad}</span>}
                      {ps.esPrincipal && <Badge variant="info">Principal</Badge>}
                    </div>
                    <span className="font-medium text-gray-700">{formatCOP(ps.precioCompra)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.descripcion && (
            <div className="card p-5">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Descripción</h3>
              <p className="text-sm text-gray-600">{product.descripcion}</p>
            </div>
          )}

          <p className="text-xs text-gray-400">Actualizado {formatDate(product.updatedAt)}</p>
        </div>
      </div>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Editar producto" size="lg">
        <ProductForm product={product} suppliers={suppliers} onSuccess={() => { setShowEdit(false); load(); }} />
      </Modal>
    </div>
  );
}
