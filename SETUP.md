# Scentual Bliss ERP — Setup

## Requisitos
- Node.js 18+
- PostgreSQL 14+
- Cuenta Cloudinary (gratis disponible)
- Shopify Partner app con acceso Admin API (opcional)

---

## 1. Instalar dependencias

```bash
npm install
```

## 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:

```env
DATABASE_URL="postgresql://USER:PASS@localhost:5432/perfume_erp"
NEXTAUTH_SECRET="genera-con: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

SHOPIFY_STORE_DOMAIN="tu-tienda.myshopify.com"
SHOPIFY_ACCESS_TOKEN="shpat_..."
SHOPIFY_API_VERSION="2024-10"
```

## 3. Configurar base de datos

```bash
# Generar cliente Prisma
npm run db:generate

# Crear tablas
npm run db:push

# Cargar datos de ejemplo (crea usuario admin + 3 proveedores + productos)
npm run db:seed
```

## 4. Correr en desarrollo

```bash
npm run dev
```

Abrir http://localhost:3000

**Credenciales por defecto:**
- Email: `admin@scentualbliss.com`
- Password: `admin123`

---

## Configurar Shopify

1. En Shopify Admin → Settings → Apps and sales channels → Develop apps
2. Crear nueva app → Configure Admin API scopes:
   - `write_products`, `read_products`
   - `write_inventory`, `read_inventory`
   - `read_locations`
3. Install app → copiar "Admin API access token"
4. Pegar en `SHOPIFY_ACCESS_TOKEN`

Al crear un producto en el ERP, se crea automáticamente en Shopify.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/login/        # Página de login
│   ├── (dashboard)/         # Layout con sidebar
│   │   ├── page.tsx          # Dashboard
│   │   ├── products/         # CRUD productos + detalle + imágenes
│   │   ├── suppliers/        # CRUD proveedores
│   │   └── purchases/        # Registro de compras
│   └── api/                  # REST endpoints
│       ├── products/
│       ├── suppliers/
│       ├── purchases/
│       ├── images/
│       └── dashboard/
├── components/
│   ├── layout/               # Sidebar, Header
│   ├── ui/                   # Modal, Badge
│   ├── products/             # ProductTable, ProductForm, ImageUploader
│   ├── suppliers/            # SupplierForm
│   ├── purchases/            # PurchaseForm
│   └── dashboard/            # MetricCard
├── services/                 # Lógica de negocio
│   ├── product.service.ts
│   ├── supplier.service.ts
│   ├── purchase.service.ts
│   ├── image.service.ts
│   └── shopify.service.ts
├── lib/                      # Conexiones externas
│   ├── prisma.ts
│   ├── auth.ts
│   ├── cloudinary.ts
│   ├── shopify.ts
│   └── utils.ts
└── types/index.ts
```

## Deploy (Vercel)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Variables de entorno en Vercel Dashboard
# DATABASE_URL → usar Neon, Supabase o Railway (PostgreSQL en la nube)
```
