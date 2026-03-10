const fs = require('fs')

const type = `type Params = { params: Promise<{ id: string }> }`

const header = `import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }
`

fs.writeFileSync('app/api/tenants/[id]/route.ts', header + `
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const row = await prisma.tenant.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    const data = await req.json()
    const updated = await prisma.tenant.update({
      where: { id },
      data: { name: data.name, phone: data.phone || null, email: data.email || null, startDate: new Date(data.startDate), endDate: data.endDate ? new Date(data.endDate) : null, rent: parseFloat(data.rent), status: data.status, notes: data.notes || null },
    })
    return NextResponse.json(updated)
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
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
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}
`)

fs.writeFileSync('app/api/payments/[id]/route.ts', header + `
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const row = await prisma.payment.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    const data = await req.json()
    const exp = parseFloat(data.expectedAmount), paid = parseFloat(data.paidAmount) || 0
    let status = paid >= exp ? 'PAID' : paid > 0 ? 'PARTIAL' : new Date() > new Date(data.dueDate) ? 'UNPAID' : 'PENDING'
    const updated = await prisma.payment.update({
      where: { id },
      data: { expectedAmount: exp, paidAmount: paid, paidDate: paid > 0 ? (data.paidDate ? new Date(data.paidDate) : new Date()) : null, status: data.status || status, method: data.method || null, notes: data.notes || null },
    })
    return NextResponse.json(updated)
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const row = await prisma.payment.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    await prisma.payment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}
`)

fs.writeFileSync('app/api/expenses/[id]/route.ts', header + `
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const row = await prisma.expense.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    const data = await req.json()
    const updated = await prisma.expense.update({ where: { id }, data: { date: new Date(data.date), amount: parseFloat(data.amount), category: data.category, description: data.description || null } })
    return NextResponse.json(updated)
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const row = await prisma.expense.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    await prisma.expense.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}
`)

fs.writeFileSync('app/api/incidents/[id]/route.ts', header + `
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
`)

fs.writeFileSync('app/api/documents/[id]/route.ts', header + `
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const row = await prisma.document.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    await prisma.document.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}
`)

console.log('All routes fixed correctly')
