import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PropertiesList } from '@/components/properties/properties-list'

export default async function PropiedadesPage() {
  const session = await getServerSession(authOptions)
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const properties = await prisma.property.findMany({
    where: { userId: session!.user!.id },
    include: {
      tenants: { where: { status: 'ACTIVE' } },
      payments: { where: { month: currentMonth, year: currentYear } },
      incidents: { where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } },
      _count: { select: { tenants: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return <PropertiesList initialProperties={properties as any} />
}
