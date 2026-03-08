import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DepositsPage } from '@/components/deposits/deposits-page'

export default async function FianzasPage() {
  const session = await getServerSession(authOptions)

  const [deposits, properties] = await Promise.all([
    prisma.deposit.findMany({
      where: { property: { userId: session!.user!.id } },
      include: {
        property: { select: { id: true, name: true } },
        tenant: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.property.findMany({
      where: { userId: session!.user!.id },
      select: {
        id: true, name: true,
        tenants: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    }),
  ])

  return <DepositsPage initialDeposits={deposits as any} properties={properties as any} />
}
