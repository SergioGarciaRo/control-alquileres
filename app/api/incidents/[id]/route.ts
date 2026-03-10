import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']
const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
const VALID_CATEGORIES = ['BREAKDOWN', 'REPAIR', 'CLEANING', 'SUPPLY', 'NOISE', 'OTHER']

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const row = await prisma.incident.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    const data = await req.json()

    if (!data.title?.trim()) return NextResponse.json({ error: 'Título requerido' }, { status: 400 })
    if (data.priority && !VALID_PRIORITIES.includes(data.priority)) {
      return NextResponse.json({ error: 'Prioridad inválida' }, { status: 400 })
    }
    if (data.status && !VALID_STATUSES.includes(data.status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }
    if (data.category && !VALID_CATEGORIES.includes(data.category)) {
      return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 })
    }

    const isResolved = data.status === 'RESOLVED' || data.status === 'CLOSED'
    const updated = await prisma.incident.update({
      where: { id },
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        category: data.category,
        priority: data.priority,
        status: data.status,
        cost: data.cost ? parseFloat(data.cost) : null,
        resolvedDate: isResolved ? (row.resolvedDate ?? new Date()) : null,
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Incident PUT error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const row = await prisma.incident.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    await prisma.incident.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Incident DELETE error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
