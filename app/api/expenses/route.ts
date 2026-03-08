import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const data = await request.json()

    const property = await prisma.property.findFirst({
      where: { id: data.propertyId, userId: session.user.id },
    })
    if (!property) return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })

    const expense = await prisma.expense.create({
      data: {
        propertyId: data.propertyId,
        date: new Date(data.date),
        amount: parseFloat(data.amount),
        category: data.category,
        description: data.description || null,
        receiptUrl: data.receiptUrl || null,
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
