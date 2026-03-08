import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const row = await prisma.incident.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    const data = await req.json()
    const updated = await prisma.incident.update({ where: { id }, data: { title: data.title, description: data.description || null, category: data.category, priority: data.priority, status: data.status, cost: data.cost ? parseFloat(data.cost) : null, resolvedDate: (data.status === 'RESOLVED' || data.status === 'CLOSED') ? new Date() : null } })
    return NextResponse.json(updated)
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
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
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}
