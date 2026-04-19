import { PrismaClient, Categoria } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Admin user
  const password = await bcrypt.hash("admin123", 10);
  const user = await prisma.user.upsert({
    where:  { email: "admin@scentualbliss.com" },
    update: {},
    create: { email: "admin@scentualbliss.com", password, name: "Admin" },
  });
  console.log("User:", user.email);

  // Suppliers
  const p2 = await prisma.supplier.create({
    data: { nombre: "Proveedor 2", telefono: "", ciudad: "Bogotá" },
  });
  const selection = await prisma.supplier.create({
    data: { nombre: "Selection Perfumería", ciudad: "Bogotá" },
  });
  const ge = await prisma.supplier.create({
    data: { nombre: "Global Essence", ciudad: "Bogotá" },
  });

  // Sample products
  await prisma.product.createMany({
    data: [
      {
        sku:         "ARM-CLUBIN-100",
        nombre:      "Club De Nuit Intense Man EDT",
        marca:       "Armaf",
        categoria:   Categoria.HOMBRE,
        tamanioMl:   105,
        precioCosto: 110000,
        precioVenta: 185000,
        margen:      0.6818,
        stock:       10,
        stockMinimo: 3,
      },
      {
        sku:         "VER-EROSF-100",
        nombre:      "Eros Flame",
        marca:       "Versace",
        categoria:   Categoria.HOMBRE,
        tamanioMl:   100,
        precioCosto: 210000,
        precioVenta: 340000,
        margen:      0.619,
        stock:       5,
        stockMinimo: 2,
      },
      {
        sku:         "CH-GOODG-80",
        nombre:      "Good Girl EDP",
        marca:       "Carolina Herrera",
        categoria:   Categoria.MUJER,
        tamanioMl:   80,
        precioCosto: 355000,
        precioVenta: 580000,
        margen:      0.634,
        stock:       2,
        stockMinimo: 2,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed completado ✓");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
