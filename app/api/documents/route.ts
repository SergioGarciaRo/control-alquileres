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

    if (!data.name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    if (!data.url?.trim()) return NextResponse.json({ error: 'URL requerida' }, { status: 400 })

    // Block dangerous URL protocols (XSS prevention)
    if (/^javascript:/i.test(data.url.trim()) || /^data:/i.test(data.url.trim())) {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
    }

    if (data.propertyId) {
      const property = await prisma.property.findFirst({
        where: { id: data.propertyId, userId: session.user.id },
      })
      if (!property) return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
    }

    // Validate tenant ownership (prevent IDOR)
    if (data.tenantId) {
      const tenant = await prisma.tenant.findFirst({
        where: { id: data.tenantId, property: { userId: session.user.id } },
      })
      if (!tenant) return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 })
    }

    // Validate incident ownership (prevent IDOR)
    if (data.incidentId) {
      const incident = await prisma.incident.findFirst({
        where: { id: data.incidentId, property: { userId: session.user.id } },
      })
      if (!incident) return NextResponse.json({ error: 'Incidencia no encontrada' }, { status: 404 })
    }

    const document = await prisma.document.create({
      data: {
        propertyId: data.propertyId || null,
        tenantId: data.tenantId || null,
        incidentId: data.incidentId || null,
        name: data.name.trim(),
        type: data.type,
        url: data.url.trim(),
        size: data.size || null,
        mimeType: data.mimeType || null,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
