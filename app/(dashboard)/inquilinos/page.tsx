import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TenantsList } from '@/components/tenants/tenants-list'

export default async function InquilinosPage() {
  const session = await getServerSession(authOptions)

  const [tenants, properties] = await Promise.all([
    prisma.tenant.findMany({
      where: { property: { userId: session!.user!.id } },
      include: {
        property: { select: { id: true, name: true, address: true } },
        deposits: true,
        tenantPayments: {
          where: { status: { in: ['PENDING', 'PARTIAL', 'UNPAID'] } },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.property.findMany({
      where: { userId: session!.user!.id },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return <TenantsList initialTenants={tenants as any} properties={properties} />
}
