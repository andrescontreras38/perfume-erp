import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supplierService } from "@/services/supplier.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supplier = await supplierService.findById(id);
  if (!supplier) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json({ data: supplier });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const supplier = await supplierService.update(id, body);
  return NextResponse.json({ data: supplier, message: "Proveedor actualizado" });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await supplierService.delete(id);
    return NextResponse.json({ message: "Proveedor eliminado" });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 400 }
    );
  }
}
