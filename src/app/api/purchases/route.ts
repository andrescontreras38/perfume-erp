import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { purchaseService } from "@/services/purchase.service";
import { z } from "zod";

const schema = z.object({
  productId:    z.string().cuid(),
  supplierId:   z.string().cuid(),
  cantidad:     z.number().int().positive(),
  precioCompra: z.number().positive(),
  notas:        z.string().optional(),
  fecha:        z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page  = Number(searchParams.get("page")  ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);

  const result = await purchaseService.findMany(page, limit);
  return NextResponse.json({ data: result });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 422 });
  }

  const purchase = await purchaseService.create(parsed.data);
  return NextResponse.json({ data: purchase, message: "Compra registrada y stock actualizado" }, { status: 201 });
}
