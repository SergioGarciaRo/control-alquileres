import { writeFileSync } from 'fs'

const makeRoute = (ops) => ops.join('\n\n')

const imports = `import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'`

const tenants = `${imports}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const tenant = await prisma.tenant.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!tenant) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    const data = await request.json()
    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        name: data.name, phone: data.phone || null, email: data.email || null,
        startDate: new Date(data.startDate), endDate: data.endDate ? new Date(data.endDate) : null,
        rent: parseFloat(data.rent), status: data.status, notes: data.notes || null,
      },
    })
    return NextResponse.json(updated)
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const tenant = await prisma.tenant.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!tenant) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    await prisma.tenant.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}`

const payments = `${imports}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const payment = await prisma.payment.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!payment) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    const data = await request.json()
    const expectedAmount = parseFloat(data.expectedAmount)
    const paidAmount = parseFloat(data.paidAmount) || 0
    let status = 'PENDING'
    if (paidAmount >= expectedAmount) status = 'PAID'
    else if (paidAmount > 0) status = 'PARTIAL'
    else if (new Date() > new Date(data.dueDate)) status = 'UNPAID'
    const updated = await prisma.payment.update({
      where: { id },
      data: {
        expectedAmount, paidAmount,
        paidDate: paidAmount > 0 ? (data.paidDate ? new Date(data.paidDate) : new Date()) : null,
        status: data.status || status, method: data.method || null, notes: data.notes || null,
      },
    })
    return NextResponse.json(updated)
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const payment = await prisma.payment.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!payment) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    await prisma.payment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}`

const expenses = `${imports}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const expense = await prisma.expense.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!expense) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    const data = await request.json()
    const updated = await prisma.expense.update({
      where: { id },
      data: { date: new Date(data.date), amount: parseFloat(data.amount), category: data.category, description: data.description || null },
    })
    return NextResponse.json(updated)
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const expense = await prisma.expense.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!expense) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    await prisma.expense.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}`

const deposits = `${imports}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const deposit = await prisma.deposit.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!deposit) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    const data = await request.json()
    const updated = await prisma.deposit.update({
      where: { id },
      data: {
        amount: parseFloat(data.amount), status: data.status,
        returnDate: data.returnDate ? new Date(data.returnDate) : null,
        retainedAmount: data.retainedAmount ? parseFloat(data.retainedAmount) : null,
        retentionReason: data.retentionReason || null,
      },
    })
    return NextResponse.json(updated)
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const deposit = await prisma.deposit.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!deposit) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    await prisma.deposit.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}`

const incidents = `${imports}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const incident = await prisma.incident.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!incident) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    const data = await request.json()
    const updated = await prisma.incident.update({
      where: { id },
      data: {
        title: data.title, description: data.description || null, category: data.category,
        priority: data.priority, status: data.status,
        cost: data.cost ? parseFloat(data.cost) : null,
        resolvedDate: (data.status === 'RESOLVED' || data.status === 'CLOSED') ? new Date() : null,
      },
    })
    return NextResponse.json(updated)
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const incident = await prisma.incident.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!incident) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    await prisma.incident.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}`

const documents = `${imports}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const document = await prisma.document.findFirst({ where: { id, property: { userId: session.user.id } } })
    if (!document) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    await prisma.document.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}`

writeFileSync('app/api/tenants/[id]/route.ts', tenants)
writeFileSync('app/api/payments/[id]/route.ts', payments)
writeFileSync('app/api/expenses/[id]/route.ts', expenses)
writeFileSync('app/api/deposits/[id]/route.ts', deposits)
writeFileSync('app/api/incidents/[id]/route.ts', incidents)
writeFileSync('app/api/documents/[id]/route.ts', documents)

console.log('All dynamic routes updated')
