import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolvePaymentStatus } from '@/lib/payment-status'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const row = await prisma.payment.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    const data = await req.json()
    const exp = parseFloat(data.expectedAmount)
    const paid = parseFloat(data.paidAmount) || 0
    const dueDate = new Date(data.dueDate)

    if (isNaN(exp) || exp < 0) return NextResponse.json({ error: 'Importe esperado inválido' }, { status: 400 })
    if (isNaN(paid) || paid < 0) return NextResponse.json({ error: 'Importe pagado inválido' }, { status: 400 })

    const status = resolvePaymentStatus(paid, exp, dueDate)

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        expectedAmount: exp,
        paidAmount: paid,
        dueDate,
        paidDate: paid > 0 ? (data.paidDate ? new Date(data.paidDate) : new Date()) : null,
        status: data.status && data.status !== 'auto' ? data.status : status,
        method: data.method || null,
        notes: data.notes || null,
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Payment PUT error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const row = await prisma.payment.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    await prisma.payment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payment DELETE error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
