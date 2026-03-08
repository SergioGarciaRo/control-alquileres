import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const row = await prisma.payment.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    const data = await req.json()
    const exp = parseFloat(data.expectedAmount), paid = parseFloat(data.paidAmount) || 0
    let status = paid >= exp ? 'PAID' : paid > 0 ? 'PARTIAL' : new Date() > new Date(data.dueDate) ? 'UNPAID' : 'PENDING'
    const updated = await prisma.payment.update({
      where: { id },
      data: { expectedAmount: exp, paidAmount: paid, paidDate: paid > 0 ? (data.paidDate ? new Date(data.paidDate) : new Date()) : null, status: data.status || status, method: data.method || null, notes: data.notes || null },
    })
    return NextResponse.json(updated)
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
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
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}
