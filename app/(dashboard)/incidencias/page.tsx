import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { IncidentsPage } from '@/components/incidents/incidents-page'

export default async function IncidenciasPage() {
  const session = await getServerSession(authOptions)

  const [incidents, properties] = await Promise.all([
    prisma.incident.findMany({
      where: { property: { userId: session!.user!.id } },
      include: {
        property: { select: { id: true, name: true } },
        tenant: { select: { id: true, name: true } },
      },
      orderBy: { openDate: 'desc' },
    }),
    prisma.property.findMany({
      where: { userId: session!.user!.id },
      select: {
        id: true, name: true,
        tenants: { where: { status: 'ACTIVE' }, select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    }),
  ])

  return <IncidentsPage initialIncidents={incidents as any} properties={properties as any} />
}
