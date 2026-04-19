import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calcMargen(precioCosto: number, precioVenta: number): number {
  if (precioCosto <= 0) return 0;
  return (precioVenta - precioCosto) / precioCosto;
}

export function formatMargen(margen: number): string {
  return `${(margen * 100).toFixed(1)}%`;
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function generateSku(marca: string, nombre: string, ml?: number): string {
  const m = marca.slice(0, 3).toUpperCase();
  const n = nombre.replace(/\s+/g, "").slice(0, 6).toUpperCase();
  const size = ml ? `-${ml}` : "";
  return `${m}-${n}${size}`;
}
