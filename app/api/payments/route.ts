import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolvePaymentStatus, validatePaymentFields } from '@/lib/payment-status'

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

    // Validate required fields
    const validationError = validatePaymentFields(data)
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })
    if (!data.propertyId) return NextResponse.json({ error: 'Propiedad requerida' }, { status: 400 })
    if (!data.dueDate) return NextResponse.json({ error: 'Fecha de vencimiento requerida' }, { status: 400 })

    const property = await prisma.property.findFirst({
      where: { id: data.propertyId, userId: session.user.id },
      include: { tenants: { where: { status: 'ACTIVE' } } },
    })
    if (!property) return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })

    // Check for duplicate payment in same month/year
    const existing = await prisma.payment.findFirst({
      where: { propertyId: data.propertyId, month: parseInt(data.month), year: parseInt(data.year) },
    })
    if (existing) {
      return NextResponse.json(
        { error: `Ya existe un pago para ${data.month}/${data.year} en esta propiedad` },
        { status: 409 }
      )
    }

    const expectedAmount = parseFloat(data.expectedAmount)
    const paidAmount = parseFloat(data.paidAmount) || 0
    const dueDate = new Date(data.dueDate)
    const status = resolvePaymentStatus(paidAmount, expectedAmount, dueDate)

    // Use a transaction so Payment + TenantPayments are atomic
    const payment = await prisma.$transaction(async (tx) => {
      const pay = await tx.payment.create({
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

      if (property.tenants.length > 0 && data.tenantPayments?.length) {
        await tx.tenantPayment.createMany({
          data: data.tenantPayments.map((tp: any) => ({
            paymentId: pay.id,
            tenantId: tp.tenantId,
            expectedAmount: parseFloat(tp.expectedAmount),
            paidAmount: parseFloat(tp.paidAmount) || 0,
            status: resolvePaymentStatus(
              parseFloat(tp.paidAmount) || 0,
              parseFloat(tp.expectedAmount),
              dueDate,
            ),
            paidDate: tp.paidDate ? new Date(tp.paidDate) : null,
          })),
        })
      }

      return pay
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Payments POST error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
