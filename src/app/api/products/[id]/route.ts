import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { productService } from "@/services/product.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const product = await productService.findById(id);
  if (!product) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json({ data: product });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if (
    body.precioCosto !== undefined &&
    body.precioVenta !== undefined &&
    body.precioVenta <= body.precioCosto
  ) {
    return NextResponse.json(
      { error: "El precio de venta debe ser mayor al costo." },
      { status: 422 }
    );
  }

  try {
    const product = await productService.update(id, body);
    return NextResponse.json({ data: product, message: "Producto actualizado" });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("Record to update not found")) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    throw err;
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await productService.delete(id);
  return NextResponse.json({ message: "Producto eliminado" });
}
