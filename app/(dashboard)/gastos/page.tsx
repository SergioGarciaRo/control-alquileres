import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ExpensesList } from '@/components/expenses/expenses-list'

export default async function GastosPage() {
  const session = await getServerSession(authOptions)

  const [expenses, properties] = await Promise.all([
    prisma.expense.findMany({
      where: { property: { userId: session!.user!.id } },
      include: { property: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
    }),
    prisma.property.findMany({
      where: { userId: session!.user!.id },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return <ExpensesList initialExpenses={expenses as any} properties={properties} />
}
