/**
 * Patches prisma/schema.prisma to replace `env("DATABASE_PROVIDER")`
 * with the actual provider string BEFORE running `prisma generate`.
 *
 * This is needed because Prisma CLI does not support env() in the provider field.
 *
 * Usage:
 *   DATABASE_PROVIDER=postgresql node scripts/prepare-schema.mjs
 *   DATABASE_PROVIDER=sqlite    node scripts/prepare-schema.mjs
 *
 * The script writes a patched copy to prisma/schema-build.prisma (gitignored),
 * which is then passed to `prisma generate --schema=prisma/schema-build.prisma`.
 * The original schema.prisma is NEVER modified.
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const provider = process.env.DATABASE_PROVIDER ?? 'sqlite'
const allowed = ['sqlite', 'postgresql', 'mysql']
if (!allowed.includes(provider)) {
  console.error(`? DATABASE_PROVIDER="${provider}" is not valid. Use: ${allowed.join(' | ')}`)
  process.exit(1)
}

const src = readFileSync(join(root, 'prisma', 'schema.prisma'), 'utf8')

const patched = src.replace(
  /provider\s*=\s*env\("DATABASE_PROVIDER"\)/,
  `provider = "${provider}"`
)

if (patched === src) {
  // Already a literal provider (e.g. during local dev after manual edit) — just copy
  console.log(`??  schema.prisma already has literal provider, copying as-is.`)
}

writeFileSync(join(root, 'prisma', 'schema-build.prisma'), patched)
console.log(`? schema-build.prisma written with provider="${provider}"`)
