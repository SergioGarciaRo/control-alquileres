import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DocumentsPage } from '@/components/documents/documents-page'

export default async function DocumentosPage() {
  const session = await getServerSession(authOptions)

  const [documents, properties] = await Promise.all([
    prisma.document.findMany({
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

  return <DocumentsPage initialDocuments={documents as any} properties={properties as any} />
}
