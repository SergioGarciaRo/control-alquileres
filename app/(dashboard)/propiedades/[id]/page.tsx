import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PropertyDetail } from '@/components/properties/property-detail'

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  const property = await prisma.property.findFirst({
    where: { id: params.id, userId: session!.user!.id },
    include: {
      tenants: { orderBy: { createdAt: 'desc' } },
      payments: {
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 24,
        include: {
          tenantPayments: { include: { tenant: { select: { id: true, name: true } } } },
        },
      },
      expenses: { orderBy: { date: 'desc' }, take: 30 },
      deposits: { include: { tenant: { select: { id: true, name: true } } } },
      incidents: {
        orderBy: { openDate: 'desc' },
        include: { tenant: { select: { id: true, name: true } } },
      },
      documents: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!property) notFound()

  return <PropertyDetail property={property as any} />
}
