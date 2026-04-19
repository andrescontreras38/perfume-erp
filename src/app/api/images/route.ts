import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { imageService } from "@/services/image.service";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file      = formData.get("file") as File | null;
  const productId = formData.get("productId") as string | null;
  const makeMain  = formData.get("makeMain") === "true";

  if (!file || !productId) {
    return NextResponse.json({ error: "file y productId son requeridos" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const image = await imageService.upload(productId, buffer, makeMain);

  return NextResponse.json({ data: image, message: "Imagen subida" }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { imageId } = await req.json();
  if (!imageId) return NextResponse.json({ error: "imageId requerido" }, { status: 400 });

  await imageService.delete(imageId);
  return NextResponse.json({ message: "Imagen eliminada" });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { imageId, productId } = await req.json();
  if (!imageId || !productId) {
    return NextResponse.json({ error: "imageId y productId son requeridos" }, { status: 400 });
  }

  await imageService.setMain(imageId, productId);
  return NextResponse.json({ message: "Imagen principal actualizada" });
}
