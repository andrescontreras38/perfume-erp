import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supplierService } from "@/services/supplier.service";
import { z } from "zod";

const schema = z.object({
  nombre:   z.string().min(1),
  telefono: z.string().optional(),
  ciudad:   z.string().optional(),
  notas:    z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await supplierService.findMany();
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 422 });
  }

  const supplier = await supplierService.create(parsed.data);
  return NextResponse.json({ data: supplier, message: "Proveedor creado" }, { status: 201 });
}
