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
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const status = searchParams.get('status')

    const payments = await prisma.payment.findMany({
      where: {
        property: { userId: session.user.id },
        ...(propertyId && { propertyId }),
        ...(month && { month: parseInt(month) }),
        ...(year && { year: parseInt(year) }),
        ...(status && { status }),
      },
      include: {
        property: { select: { id: true, name: true, address: true } },
        tenantPayments: { include: { tenant: { select: { id: true, name: true } } } },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Payments GET error:', error)
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
      include: { tenants: { where: { status: 'ACTIVE' } } },
    })
    if (!property) return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })

    const expectedAmount = parseFloat(data.expectedAmount)
    const paidAmount = parseFloat(data.paidAmount) || 0
    const dueDate = new Date(data.dueDate)

    let status = 'PENDING'
    if (paidAmount >= expectedAmount) status = 'PAID'
    else if (paidAmount > 0 && paidAmount < expectedAmount) status = 'PARTIAL'
    else if (paidAmount === 0 && new Date() > dueDate) status = 'UNPAID'

    const payment = await prisma.payment.create({
      data: {
        propertyId: data.propertyId,
        month: parseInt(data.month),
        year: parseInt(data.year),
        expectedAmount,
        paidAmount,
        dueDate,
        paidDate: data.paidDate ? new Date(data.paidDate) : null,
        status,
        method: data.method || null,
        notes: data.notes || null,
      },
    })

    // Create individual tenant payments if there are multiple tenants
    if (property.tenants.length > 0 && data.tenantPayments) {
      for (const tp of data.tenantPayments) {
        await prisma.tenantPayment.create({
          data: {
            paymentId: payment.id,
            tenantId: tp.tenantId,
            expectedAmount: parseFloat(tp.expectedAmount),
            paidAmount: parseFloat(tp.paidAmount) || 0,
            status: tp.status || 'PENDING',
            paidDate: tp.paidDate ? new Date(tp.paidDate) : null,
          },
        })
      }
    }

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Payments POST error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
