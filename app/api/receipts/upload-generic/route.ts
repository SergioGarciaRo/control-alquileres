/**
 * Generic file upload endpoint.
 * Saves to /public/receipts/ and returns the public URL.
 * Used by the Expense form to upload invoices before saving the expense record.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
const MAX_SIZE_BYTES = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const context = (formData.get('context') as string) || 'file'

    if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Usa PDF, JPG, PNG o WEBP.' },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'El archivo no puede superar 5 MB' }, { status: 400 })
    }

    const ext = extname(file.name).replace(/[^a-zA-Z0-9.]/g, '').slice(0, 10) || '.pdf'
    const safeContext = (context || 'file').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20)
    const filename = `${safeContext}-${session.user.id}-${Date.now()}${ext}`
    const uploadDir = join(process.cwd(), 'public', 'receipts')

    await mkdir(uploadDir, { recursive: true })
    await writeFile(join(uploadDir, filename), Buffer.from(await file.arrayBuffer()))

    return NextResponse.json({ url: `/receipts/${filename}`, name: file.name })
  } catch (error) {
    console.error('Generic upload error:', error)
    return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 })
  }
}
