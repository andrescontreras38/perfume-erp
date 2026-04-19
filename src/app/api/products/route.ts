import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { productService } from "@/services/product.service";
import { z } from "zod";
import { Categoria } from "@prisma/client";

const createSchema = z.object({
  sku:         z.string().min(1),
  nombre:      z.string().min(1),
  marca:       z.string().min(1),
  descripcion: z.string().optional(),
  categoria:   z.nativeEnum(Categoria),
  tamanioMl:   z.number().int().positive().optional(),
  precioCosto: z.number().nonnegative(),
  precioVenta: z.number().positive(),
  stock:       z.number().int().nonnegative(),
  stockMinimo: z.number().int().nonnegative().default(5),
  estado:      z.boolean().default(true),
  suppliers:   z.array(z.object({
    supplierId:   z.string().cuid(),
    precioCompra: z.number().nonnegative(),
    esPrincipal:  z.boolean(),
  })).default([]),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filters = {
    search:     searchParams.get("search") ?? undefined,
    categoria:  searchParams.get("categoria") as Categoria | undefined,
    supplierId: searchParams.get("supplierId") ?? undefined,
    bajoStock:  searchParams.get("bajoStock") === "true",
    estado:     searchParams.has("estado") ? searchParams.get("estado") === "true" : undefined,
    orderBy:    (searchParams.get("orderBy") as "margen" | "stock" | undefined) ?? undefined,
    order:      (searchParams.get("order") as "asc" | "desc") ?? "desc",
    page:       Number(searchParams.get("page") ?? 1),
    limit:      Number(searchParams.get("limit") ?? 20),
  };

  const result = await productService.findMany(filters);
  return NextResponse.json({ data: result });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 422 });
  }

  if (parsed.data.precioVenta <= parsed.data.precioCosto) {
    return NextResponse.json({ error: "El precio de venta debe ser mayor al costo." }, { status: 422 });
  }

  try {
    const product = await productService.create(parsed.data);
    return NextResponse.json({ data: product, message: "Producto creado" }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "El SKU ya existe." }, { status: 409 });
    }
    throw err;
  }
}
