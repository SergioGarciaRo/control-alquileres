import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join, extname, basename } from 'path'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const paymentId = formData.get('paymentId') as string | null

    if (!file || !paymentId) {
      return NextResponse.json({ error: 'Archivo y paymentId son requeridos' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Usa PDF, JPG, PNG o WEBP.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'El archivo no puede superar 5 MB' }, { status: 400 })
    }

    // Verify payment belongs to the authenticated user
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, property: { userId: session.user.id } },
    })
    if (!payment) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })

    const rawExt = extname(file.name).replace(/[^a-zA-Z0-9.]/g, '').slice(0, 10)
    const ext = rawExt || (file.type === 'application/pdf' ? '.pdf' : '.jpg')
    const filename = `receipt-${paymentId}-${Date.now()}${ext}`
    const uploadDir = join(process.cwd(), 'public', 'receipts')

    await mkdir(uploadDir, { recursive: true })
    await writeFile(join(uploadDir, filename), Buffer.from(await file.arrayBuffer()))

    const url = `/receipts/${filename}`
    await prisma.payment.update({
      where: { id: paymentId },
      data: { receiptUrl: url, receiptName: file.name },
    })

    return NextResponse.json({ url, name: file.name })
  } catch (error) {
    console.error('Receipt upload error:', error)
    return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { paymentId } = await request.json()
    if (!paymentId) return NextResponse.json({ error: 'paymentId requerido' }, { status: 400 })

    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, property: { userId: session.user.id } },
    })
    if (!payment) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })

    // Delete physical file if it exists
    if (payment.receiptUrl) {
      const filename = basename(payment.receiptUrl)
      const filePath = join(process.cwd(), 'public', 'receipts', filename)
      try { await unlink(filePath) } catch { /* file already gone, ignore */ }
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: { receiptUrl: null, receiptName: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Receipt delete error:', error)
    return NextResponse.json({ error: 'Error al eliminar el justificante' }, { status: 500 })
  }
}
