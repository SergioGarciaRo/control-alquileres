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

    const incidents = await prisma.incident.findMany({
      where: {
        property: { userId: session.user.id },
        ...(propertyId && { propertyId }),
        ...(status && { status }),
      },
      include: {
        property: { select: { id: true, name: true } },
        tenant: { select: { id: true, name: true } },
      },
      orderBy: { openDate: 'desc' },
    })

    return NextResponse.json(incidents)
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

    const incident = await prisma.incident.create({
      data: {
        propertyId: data.propertyId,
        tenantId: data.tenantId || null,
        title: data.title,
        description: data.description || null,
        category: data.category,
        priority: data.priority || 'MEDIUM',
        status: data.status || 'OPEN',
        cost: data.cost ? parseFloat(data.cost) : null,
        openDate: data.openDate ? new Date(data.openDate) : new Date(),
        resolvedDate: data.resolvedDate ? new Date(data.resolvedDate) : null,
      },
    })

    // If incident is high priority, update property status
    if (data.priority === 'HIGH') {
      await prisma.property.update({
        where: { id: data.propertyId },
        data: { status: 'INCIDENT' },
      })
    }

    return NextResponse.json(incident, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
