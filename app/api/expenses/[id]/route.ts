import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseDate, parseNumber, trimOrNull } from '@/lib/input'

type Params = { params: Promise<{ id: string }> }

const VALID_CATEGORIES = [
  'COMMUNITY',
  'ELECTRICITY',
  'WATER',
  'GAS',
  'INTERNET',
  'INSURANCE',
  'IBI',
  'REPAIR',
  'CLEANING',
  'OTHER',
]

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const row = await prisma.expense.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    const data = await req.json()

    const date = parseDate(data.date)
    if (!date) return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })

    const amount = parseNumber(data.amount, { min: 0 })
    if (amount === null) return NextResponse.json({ error: 'Importe inválido' }, { status: 400 })

    if (!data.category || !VALID_CATEGORIES.includes(data.category)) {
      return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 })
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        date,
        amount,
        category: data.category,
        description: trimOrNull(data.description),
        receiptUrl: data.receiptUrl ?? row.receiptUrl,
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Expenses PUT error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const row = await prisma.expense.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    await prisma.expense.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Expenses DELETE error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
