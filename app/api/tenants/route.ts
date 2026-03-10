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
    const status = searchParams.get('status')

    const tenants = await prisma.tenant.findMany({
      where: {
        property: { userId: session.user.id },
        ...(propertyId && { propertyId }),
        ...(status && { status }),
      },
      include: {
        property: { select: { id: true, name: true, address: true } },
        deposits: true,
        tenantPayments: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tenants)
  } catch (error) {
    console.error('Tenants GET error:', error)
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
    if (!data.name?.trim()) return NextResponse.json({ error: 'Nombre del inquilino requerido' }, { status: 400 })
    if (!data.startDate) return NextResponse.json({ error: 'Fecha de inicio requerida' }, { status: 400 })

    const rent = parseFloat(data.rent)
    if (isNaN(rent) || rent < 0) {
      return NextResponse.json({ error: 'Renta inválida' }, { status: 400 })
    }

    const startDate = new Date(data.startDate)
    if (isNaN(startDate.getTime())) {
      return NextResponse.json({ error: 'Fecha de inicio inválida' }, { status: 400 })
    }

    let endDate: Date | null = null
    if (data.endDate) {
      endDate = new Date(data.endDate)
      if (isNaN(endDate.getTime())) {
        return NextResponse.json({ error: 'Fecha de fin inválida' }, { status: 400 })
      }
      if (endDate <= startDate) {
        return NextResponse.json({ error: 'La fecha de fin debe ser posterior a la de inicio' }, { status: 400 })
      }
    }

    // Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: { id: data.propertyId, userId: session.user.id },
    })
    if (!property) return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })

    const tenant = await prisma.tenant.create({
      data: {
        propertyId: data.propertyId,
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        dni: data.dni?.trim() || null,
        startDate,
        endDate,
        rent,
        status: data.status || 'ACTIVE',
        notes: data.notes?.trim() || null,
      },
    })

    // Update property status to OCCUPIED if tenant is active
    if (tenant.status === 'ACTIVE') {
      await prisma.property.update({
        where: { id: data.propertyId },
        data: { status: 'OCCUPIED' },
      })
    }

    return NextResponse.json(tenant, { status: 201 })
  } catch (error) {
    console.error('Tenants POST error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
