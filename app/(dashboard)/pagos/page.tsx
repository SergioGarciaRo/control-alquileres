import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PaymentsList } from '@/components/payments/payments-list'

export default async function PagosPage() {
  const session = await getServerSession(authOptions)
  const now = new Date()

  const [payments, properties] = await Promise.all([
    prisma.payment.findMany({
      where: { property: { userId: session!.user!.id } },
      include: {
        property: { select: { id: true, name: true } },
        tenantPayments: { include: { tenant: { select: { id: true, name: true } } } },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    }),
    prisma.property.findMany({
      where: { userId: session!.user!.id },
      select: {
        id: true, name: true,
        tenants: { where: { status: 'ACTIVE' }, select: { id: true, name: true, rent: true } },
      },
      orderBy: { name: 'asc' },
    }),
  ])

  return <PaymentsList initialPayments={payments as any} properties={properties as any} />
}
