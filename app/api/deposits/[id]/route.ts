import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseDate, parseNumber, trimOrNull } from '@/lib/input'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const deposit = await prisma.deposit.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!deposit) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    const data = await request.json()

    const amount = parseNumber(data.amount, { min: 0, allowZero: false })
    if (amount === null) {
      return NextResponse.json({ error: 'Importe de fianza inválido (debe ser mayor que 0)' }, { status: 400 })
    }

    const returnDate = data.returnDate ? parseDate(data.returnDate) : null
    if (data.returnDate && !returnDate) {
      return NextResponse.json({ error: 'Fecha de devolución inválida' }, { status: 400 })
    }

    const retainedAmount = data.retainedAmount ? parseNumber(data.retainedAmount, { min: 0 }) : null
    if (data.retainedAmount && retainedAmount === null) {
      return NextResponse.json({ error: 'Importe retenido inválido' }, { status: 400 })
    }
    if (retainedAmount !== null && retainedAmount > amount) {
      return NextResponse.json({ error: 'El importe retenido no puede superar el importe de la fianza' }, { status: 400 })
    }

    const updated = await prisma.deposit.update({
      where: { id },
      data: {
        amount,
        status: data.status,
        returnDate,
        retainedAmount,
        retentionReason: trimOrNull(data.retentionReason),
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Deposit PUT error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
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
  } catch (error) {
    console.error('Deposit DELETE error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}