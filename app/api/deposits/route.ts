import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const deposits = await prisma.deposit.findMany({
      where: { property: { userId: session.user.id } },
      include: {
        property: { select: { id: true, name: true } },
        tenant: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(deposits)
  } catch (error) {
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
    if (!data.tenantId) return NextResponse.json({ error: 'Inquilino requerido' }, { status: 400 })
    if (!data.deliveryDate) return NextResponse.json({ error: 'Fecha de entrega requerida' }, { status: 400 })

    const amount = parseFloat(data.amount)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Importe de fianza inválido (debe ser mayor que 0)' }, { status: 400 })
    }

    const deliveryDate = new Date(data.deliveryDate)
    if (isNaN(deliveryDate.getTime())) {
      return NextResponse.json({ error: 'Fecha de entrega inválida' }, { status: 400 })
    }

    const property = await prisma.property.findFirst({
      where: { id: data.propertyId, userId: session.user.id },
    })
    if (!property) return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })

    const deposit = await prisma.deposit.create({
      data: {
        propertyId: data.propertyId,
        tenantId: data.tenantId,
        amount,
        deliveryDate,
        status: data.status || 'HELD',
        returnDate: data.returnDate ? new Date(data.returnDate) : null,
        retainedAmount: data.retainedAmount ? parseFloat(data.retainedAmount) : null,
        retentionReason: data.retentionReason || null,
      },
    })

    return NextResponse.json(deposit, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
