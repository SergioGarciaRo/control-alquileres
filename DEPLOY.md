# Despliegue en Vercel + PostgreSQL

## Opción 1: Vercel (Recomendada - Gratis hasta cierto límite)

### 1. Preparar base de datos PostgreSQL

Opciones gratuitas:
- **Neon.tech** (recomendado, generoso free tier): https://neon.tech
- **Supabase**: https://supabase.com
- **Railway**: https://railway.app

### 2. Cambiar el provider de Prisma a PostgreSQL

Edita `prisma/schema.prisma`:
```
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. Variables de entorno en Vercel

En el panel de Vercel > Settings > Environment Variables, añade:
```
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
NEXTAUTH_SECRET=genera-una-clave-muy-larga-y-aleatoria-aqui
NEXTAUTH_URL=https://tu-app.vercel.app
```

Para generar NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 4. Desplegar

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login en Vercel
vercel login

# Desplegar
vercel

# O para producción directamente
vercel --prod
```

### 5. Ejecutar migraciones y seed en producción

```bash
# Migrar base de datos
vercel env pull .env.production.local
npx prisma migrate deploy

# Opcional: cargar datos de demo
curl -X POST https://tu-app.vercel.app/api/seed
```

---

## Opción 2: Railway (Todo en uno, muy fácil)

Railway puede alojar tanto la app Next.js como la base de datos PostgreSQL.

1. Crear cuenta en https://railway.app
2. New Project > Deploy from GitHub repo
3. Add plugin PostgreSQL
4. Configurar las variables de entorno
5. Railway hace el deploy automáticamente

---

## Opción 3: VPS propio (más control)

Si tienes un VPS (DigitalOcean, Hetzner, etc.):

```bash
# Instalar Node.js, PM2, Nginx
npm install -g pm2

# Clonar y configurar
git clone tu-repo
cd control-alquileres
npm install
npx prisma migrate deploy
npm run build

# Arrancar con PM2
pm2 start npm --name "rental-manager" -- start

# Nginx como proxy inverso
# Configurar SSL con Certbot
```

---

## Credenciales de demo

- **Email**: demo@rentalmanager.es
- **Password**: demo1234

Ejecuta `/api/seed` (POST) para cargar datos de ejemplo.
