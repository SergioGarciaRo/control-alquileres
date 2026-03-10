import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VALID_CATEGORIES = [
  'COMMUNITY', 'ELECTRICITY', 'WATER', 'GAS', 'INTERNET',
  'INSURANCE', 'IBI', 'REPAIR', 'CLEANING', 'OTHER',
]

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const category = searchParams.get('category')

    const expenses = await prisma.expense.findMany({
      where: {
        property: { userId: session.user.id },
        ...(propertyId && { propertyId }),
        ...(category && { category }),
      },
      include: {
        property: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Expenses GET error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const data = await request.json()

    // Validate required fields
    if (!data.propertyId) return NextResponse.json({ error: 'Propiedad requerida' }, { status: 400 })
    if (!data.date) return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })
    if (!data.category || !VALID_CATEGORIES.includes(data.category)) {
      return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 })
    }

    const amount = parseFloat(data.amount)
    if (isNaN(amount) || amount < 0) {
      return NextResponse.json({ error: 'Importe inválido' }, { status: 400 })
    }

    const date = new Date(data.date)
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
    }

    const property = await prisma.property.findFirst({
      where: { id: data.propertyId, userId: session.user.id },
    })
    if (!property) return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })

    const expense = await prisma.expense.create({
      data: {
        propertyId: data.propertyId,
        date,
        amount,
        category: data.category,
        description: data.description?.trim() || null,
        receiptUrl: data.receiptUrl || null,
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Expenses POST error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
