import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const deposit = await prisma.deposit.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!deposit) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    const data = await request.json()
    const updated = await prisma.deposit.update({
      where: { id },
      data: {
        amount: parseFloat(data.amount), status: data.status,
        returnDate: data.returnDate ? new Date(data.returnDate) : null,
        retainedAmount: data.retainedAmount ? parseFloat(data.retainedAmount) : null,
        retentionReason: data.retentionReason || null,
      },
    })
    return NextResponse.json(updated)
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const deposit = await prisma.deposit.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!deposit) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    await prisma.deposit.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}