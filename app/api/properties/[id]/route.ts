import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkOwnership(propertyId: string, userId: string) {
  return prisma.property.findFirst({ where: { id: propertyId, userId } })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const property = await prisma.property.findFirst({
      where: { id, userId: session.user.id },
      include: {
        tenants: { orderBy: { createdAt: 'desc' } },
        payments: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 12, include: { tenantPayments: { include: { tenant: true } } } },
        expenses: { orderBy: { date: 'desc' }, take: 20 },
        deposits: { include: { tenant: true } },
        incidents: { orderBy: { openDate: 'desc' }, include: { tenant: true } },
        documents: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!property) return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
    return NextResponse.json(property)
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const owned = await checkOwnership(id, session.user.id)
    if (!owned) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    const data = await request.json()
    const property = await prisma.property.update({
      where: { id },
      data: {
        name: data.name, address: data.address, type: data.type,
        rooms: data.rooms ? parseInt(data.rooms) : null, status: data.status,
        expectedRent: parseFloat(data.expectedRent) || 0,
        fixedExpenses: parseFloat(data.fixedExpenses) || 0,
        notes: data.notes,
      },
    })
    return NextResponse.json(property)
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const owned = await checkOwnership(id, session.user.id)
    if (!owned) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    await prisma.property.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
