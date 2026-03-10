import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseDate, parseNumber, trimOrNull, trimOrUndefined } from '@/lib/input'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const row = await prisma.tenant.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    const data = await req.json()

    const name = trimOrUndefined(data.name)
    if (!name) return NextResponse.json({ error: 'Nombre del inquilino requerido' }, { status: 400 })

    const startDate = parseDate(data.startDate)
    if (!startDate) return NextResponse.json({ error: 'Fecha de inicio inválida' }, { status: 400 })

    let endDate: Date | null = null
    if (data.endDate) {
      endDate = parseDate(data.endDate)
      if (!endDate) return NextResponse.json({ error: 'Fecha de fin inválida' }, { status: 400 })
      if (endDate <= startDate) {
        return NextResponse.json({ error: 'La fecha de fin debe ser posterior a la de inicio' }, { status: 400 })
      }
    }

    const rent = parseNumber(data.rent, { min: 0 })
    if (rent === null) return NextResponse.json({ error: 'Renta inválida' }, { status: 400 })

    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        name,
        phone: trimOrNull(data.phone),
        email: trimOrNull(data.email),
        dni: trimOrNull(data.dni),
        startDate,
        endDate,
        rent,
        status: data.status,
        notes: trimOrNull(data.notes),
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Tenants PUT error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const row = await prisma.tenant.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    await prisma.tenant.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Tenants DELETE error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
