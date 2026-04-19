import { Categoria, Role } from "@prisma/client";

export type { Categoria, Role };

// ─── Product ──────────────────────────────────────────────────────────────────

export interface ProductWithRelations {
  id: string;
  sku: string;
  nombre: string;
  marca: string;
  descripcion: string | null;
  categoria: Categoria;
  tamanioMl: number | null;
  precioCosto: number;
  precioVenta: number;
  margen: number;
  stock: number;
  stockMinimo: number;
  estado: boolean;
  shopifyId: string | null;
  shopifyHandle: string | null;
  suppliers: ProductSupplierWithSupplier[];
  images: ImageRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductSupplierWithSupplier {
  id: string;
  supplierId: string;
  precioCompra: number;
  esPrincipal: boolean;
  supplier: {
    id: string;
    nombre: string;
    ciudad: string | null;
  };
}

export interface ImageRecord {
  id: string;
  url: string;
  publicId: string;
  esPrincipal: boolean;
  orden: number;
}

// ─── Supplier ─────────────────────────────────────────────────────────────────

export interface SupplierWithCount {
  id: string;
  nombre: string;
  telefono: string | null;
  ciudad: string | null;
  notas: string | null;
  _count: { products: number; purchases: number };
  createdAt: Date;
}

// ─── Purchase ─────────────────────────────────────────────────────────────────

export interface PurchaseWithRelations {
  id: string;
  productId: string;
  supplierId: string;
  cantidad: number;
  precioCompra: number;
  total: number;
  notas: string | null;
  fecha: Date;
  product: { sku: string; nombre: string; marca: string };
  supplier: { nombre: string };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  totalProductos: number;
  productosActivos: number;
  valorInventario: number;
  margenPromedio: number;
  bajosStock: number;
  totalProveedores: number;
  comprasMes: number;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Forms ────────────────────────────────────────────────────────────────────

export interface ProductFormData {
  sku: string;
  nombre: string;
  marca: string;
  descripcion?: string;
  categoria: Categoria;
  tamanioMl?: number;
  precioCosto: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
  estado: boolean;
  suppliers: {
    supplierId: string;
    precioCompra: number;
    esPrincipal: boolean;
  }[];
}

export interface SupplierFormData {
  nombre: string;
  telefono?: string;
  ciudad?: string;
  notas?: string;
}

export interface PurchaseFormData {
  productId: string;
  supplierId: string;
  cantidad: number;
  precioCompra: number;
  notas?: string;
  fecha?: string;
}
