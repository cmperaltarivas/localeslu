# Locales La Unión

Directorio de locales y negocios de La Unión, Chile. Plataforma colaborativa donde cualquier persona puede agregar, comentar y reseñar negocios locales.

## Tecnologías

- **Next.js 16** (App Router)
- **TypeScript**
- **Prisma** + SQLite
- **Tailwind CSS v4**
- **NextAuth.js** (Google OAuth)
- **Google Maps API** (selección de ubicación)
- **OpenStreetMap** (visualización pública)

## Requisitos

- Node.js 18+
- Cuenta de Google Cloud (para OAuth y Maps API)

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/cmperaltarivas/localeslu.git
cd localeslu

# Instalar dependencias
npm install
```

## Configuración

Crear archivo `.env` en la raíz:

```env
DATABASE_URL="file:./dev.db"

# Google OAuth (https://console.cloud.google.com)
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=un_secret_aleatorio

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key
```

## Base de datos

```bash
# Generar el cliente de Prisma
npx prisma generate

# Sincronizar el esquema con la base de datos
npx prisma db push
```

## Ejecutar

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Administrador

El admin se define por email. Por defecto: `cmperaltarivas@gmail.com`

El panel de administración está en `/admin` y permite:
- Ver estadísticas generales
- Gestionar usuarios (activar, desactivar, eliminar)
- Aprobar o rechazar reseñas

## Estructura del proyecto

```
src/
  app/
    page.tsx          # Landing page
    buscar/           # Búsqueda de locales
    local/[id]/       # Página pública del local
    auth/             # Inicio de sesión con Google
    dashboard/        # Panel del usuario (mis locales, colaboraciones)
    admin/            # Panel de administración
    api/              # Endpoints REST
      locales/        # CRUD de locales
      resenas/        # Reseñas
      colaboradores/  # Sistema de colaboración
      ediciones/      # Sugerencias de edición
      admin/          # Endpoints de admin
  components/         # Componentes reutilizables
  lib/                # Utilidades (Prisma, Auth, Google Maps)
prisma/
  schema.prisma       # Modelo de datos
```

## Funcionalidades

- Autenticación con Google (único método)
- Crear y editar locales con categorías, productos/servicios y precios
- Mapa interactivo para seleccionar ubicación
- Sistema de reseñas con aprobación del administrador
- Búsqueda por nombre, categoría o ubicación
- Sistema de colaboradores: varios usuarios pueden gestionar un mismo local con aprobación del dueño
- Sugerencias de edición: los colaboradores proponen cambios que el dueño aprueba o rechaza
- Panel de administración con estadísticas