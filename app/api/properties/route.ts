import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const properties = await prisma.property.findMany({
      where: { userId: session.user.id },
      include: {
        tenants: { where: { status: 'ACTIVE' } },
        _count: {
          select: {
            tenants: true,
            payments: true,
            incidents: { where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(properties)
  } catch (error) {
    console.error('Properties GET error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const property = await prisma.property.create({
      data: {
        userId: session.user.id,
        name: data.name,
        address: data.address,
        type: data.type || 'APARTMENT',
        rooms: data.rooms ? parseInt(data.rooms) : null,
        status: data.status || 'AVAILABLE',
        expectedRent: parseFloat(data.expectedRent) || 0,
        fixedExpenses: parseFloat(data.fixedExpenses) || 0,
        notes: data.notes,
      },
    })

    return NextResponse.json(property, { status: 201 })
  } catch (error) {
    console.error('Properties POST error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
