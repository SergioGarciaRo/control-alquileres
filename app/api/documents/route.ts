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
    const tenantId = searchParams.get('tenantId')
    const type = searchParams.get('type')

    const documents = await prisma.document.findMany({
      where: {
        property: { userId: session.user.id },
        ...(propertyId && { propertyId }),
        ...(tenantId && { tenantId }),
        ...(type && { type }),
      },
      include: {
        property: { select: { id: true, name: true } },
        tenant: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(documents)
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const data = await request.json()

    if (data.propertyId) {
      const property = await prisma.property.findFirst({
        where: { id: data.propertyId, userId: session.user.id },
      })
      if (!property) return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
    }

    const document = await prisma.document.create({
      data: {
        propertyId: data.propertyId || null,
        tenantId: data.tenantId || null,
        incidentId: data.incidentId || null,
        name: data.name,
        type: data.type,
        url: data.url,
        size: data.size || null,
        mimeType: data.mimeType || null,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
