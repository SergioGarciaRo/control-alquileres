import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.user.id
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const properties = await prisma.property.findMany({
      where: { userId },
      include: {
        tenants: { where: { status: 'ACTIVE' } },
        payments: {
          where: { month: currentMonth, year: currentYear },
        },
        expenses: {
          where: {
            date: {
              gte: new Date(currentYear, currentMonth - 1, 1),
              lt: new Date(currentYear, currentMonth, 1),
            },
          },
        },
        incidents: { where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } },
      },
    })

    const totalProperties = properties.length
    const occupiedProperties = properties.filter((p) => p.status === 'OCCUPIED').length
    const availableProperties = properties.filter((p) => p.status === 'AVAILABLE').length

    let monthlyIncome = 0
    let monthlyExpenses = 0
    let pendingPayments = 0
    let overduePayments = 0
    let openIncidents = 0
    let totalDebt = 0

    for (const property of properties) {
      // Income
      for (const payment of property.payments) {
        monthlyIncome += payment.paidAmount
        if (payment.status === 'PENDING' || payment.status === 'PARTIAL') {
          pendingPayments++
          totalDebt += payment.expectedAmount - payment.paidAmount
        }
        if (payment.status === 'UNPAID') {
          overduePayments++
          totalDebt += payment.expectedAmount
        }
      }

      // Expenses
      for (const expense of property.expenses) {
        monthlyExpenses += expense.amount
      }

      // Incidents
      openIncidents += property.incidents.length
    }

    const monthlyNetProfit = monthlyIncome - monthlyExpenses
    const totalExpected = properties.reduce((acc, p) => {
      const monthPayments = p.payments
      const expected = monthPayments.reduce((s, pay) => s + pay.expectedAmount, 0)
      return acc + expected
    }, 0)
    const collectionRate = totalExpected > 0 ? (monthlyIncome / totalExpected) * 100 : 0

    // Rentability by property
    const rentabilityByProperty = properties.map((p) => {
      const income = p.payments.reduce((acc, pay) => acc + pay.paidAmount, 0)
      const expenses = p.expenses.reduce((acc, exp) => acc + exp.amount, 0)
      const netProfit = income - expenses
      const rentability = p.expectedRent > 0 ? (netProfit / p.expectedRent) * 100 : 0
      return {
        propertyId: p.id,
        propertyName: p.name,
        income,
        expenses,
        netProfit,
        rentability: Math.round(rentability * 100) / 100,
      }
    }).sort((a, b) => b.rentability - a.rentability)

    // Recent alerts
    const allPayments = await prisma.payment.findMany({
      where: {
        property: { userId },
        status: { in: ['PENDING', 'PARTIAL', 'UNPAID'] },
        dueDate: { lt: now },
      },
      include: { property: true },
      orderBy: { dueDate: 'asc' },
      take: 10,
    })

    return NextResponse.json({
      stats: {
        totalProperties,
        occupiedProperties,
        availableProperties,
        monthlyIncome,
        monthlyExpenses,
        monthlyNetProfit,
        pendingPayments,
        overduePayments,
        openIncidents,
        totalDebt,
        collectionRate: Math.round(collectionRate * 100) / 100,
      },
      rentabilityByProperty,
      overdueAlerts: allPayments,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
