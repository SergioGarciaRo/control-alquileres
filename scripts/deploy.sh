#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Despliegue automatizado de RentalManager a Vercel + Neon
# =============================================================================
# Uso:
#   bash scripts/deploy.sh              → deploy a producción
#   bash scripts/deploy.sh --preview    → deploy de preview
#
# Variables de entorno necesarias (configuradas en Vercel o en .env.production):
#   DATABASE_URL        → postgres://...  (Neon.tech)
#   DATABASE_PROVIDER   → postgresql
#   NEXTAUTH_SECRET     → clave segura
#   NEXTAUTH_URL        → https://tudominio.vercel.app
#   SEED_SECRET         → clave para /api/seed (opcional)
# =============================================================================

set -euo pipefail

PROD_FLAG="--prod"
if [[ "${1:-}" == "--preview" ]]; then
  PROD_FLAG=""
  echo "🔍 Modo PREVIEW"
else
  echo "🚀 Modo PRODUCCIÓN"
fi

# ── 1. Verificar que el CLI de Vercel está instalado ─────────────────────────
if ! command -v vercel &>/dev/null; then
  echo "❌ Vercel CLI no instalado. Ejecuta: npm i -g vercel"
  exit 1
fi

# ── 2. Verificar que estamos en el directorio correcto ───────────────────────
if [[ ! -f "package.json" ]]; then
  echo "❌ Ejecuta este script desde la raíz del proyecto"
  exit 1
fi

# ── 3. Limpiar build anterior ────────────────────────────────────────────────
echo "🧹 Limpiando build anterior..."
rm -rf .next

# ── 4. Instalar dependencias (garantiza postinstall con prisma generate) ─────
echo "📦 Instalando dependencias..."
DATABASE_PROVIDER=postgresql npm install

# ── 5. Build local de verificación ───────────────────────────────────────────
echo "🔨 Verificando build local con PostgreSQL..."
DATABASE_PROVIDER=postgresql npm run build

echo "✅ Build local OK"

# ── 6. Deploy a Vercel ────────────────────────────────────────────────────────
echo "☁️  Desplegando a Vercel..."
vercel $PROD_FLAG --yes

echo ""
echo "✅ Deploy completado."
echo ""
echo "📋 Próximos pasos si es el PRIMER despliegue:"
echo "   1. Asegúrate de tener en Vercel → Settings → Environment Variables:"
echo "      DATABASE_URL        = postgres://..."
echo "      DATABASE_PROVIDER   = postgresql"
echo "      NEXTAUTH_SECRET     = <clave segura>"
echo "      NEXTAUTH_URL        = https://tu-app.vercel.app"
echo "      SEED_SECRET         = <clave para seed>"
echo ""
echo "   2. Ejecuta la migración de BD:"
echo "      DATABASE_PROVIDER=postgresql npx prisma migrate deploy --schema=prisma/schema-build.prisma"
echo ""
echo "   3. Carga los datos demo (opcional):"
echo "      curl -X POST https://tu-app.vercel.app/api/seed -H 'x-seed-secret: TU_SEED_SECRET'"
