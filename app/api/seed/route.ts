import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const seedSecret = process.env.SEED_SECRET
  const secretHeader = request.headers.get('x-seed-secret')

  // If a secret is configured and a header is provided, it must match.
  // This makes the header optional for convenience in the public demo.
  if (seedSecret && secretHeader && secretHeader !== seedSecret) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    // Clear existing data
    await prisma.document.deleteMany()
    await prisma.reminder.deleteMany()
    await prisma.incident.deleteMany()
    await prisma.deposit.deleteMany()
    await prisma.tenantPayment.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.expense.deleteMany()
    await prisma.tenant.deleteMany()
    await prisma.property.deleteMany()
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()

    // Create demo user
    const hashedPassword = await bcrypt.hash('demo1234', 12)
    const user = await prisma.user.create({
      data: {
        name: 'Carlos Propietario',
        email: 'demo@rentalmanager.es',
        password: hashedPassword,
      },
    })

    // Create properties
    const prop1 = await prisma.property.create({
      data: {
        userId: user.id,
        name: 'Piso Malasaña',
        address: 'Calle Fuencarral 42, 2ºA, Madrid',
        type: 'APARTMENT',
        rooms: 3,
        status: 'OCCUPIED',
        expectedRent: 1200,
        fixedExpenses: 150,
        notes: 'Piso reformado en 2022. Muy buena ubicación.',
      },
    })

    const prop2 = await prisma.property.create({
      data: {
        userId: user.id,
        name: 'Habitación Lavapiés 1',
        address: 'Calle Argumosa 8, 3ºB - Hab. 1, Madrid',
        type: 'ROOM',
        rooms: 1,
        status: 'OCCUPIED',
        expectedRent: 550,
        fixedExpenses: 80,
        notes: 'Habitación doble con baño compartido.',
      },
    })

    const prop3 = await prisma.property.create({
      data: {
        userId: user.id,
        name: 'Habitación Lavapiés 2',
        address: 'Calle Argumosa 8, 3ºB - Hab. 2, Madrid',
        type: 'ROOM',
        rooms: 1,
        status: 'OCCUPIED',
        expectedRent: 500,
        fixedExpenses: 80,
        notes: 'Habitación individual con baño compartido.',
      },
    })

    const prop4 = await prisma.property.create({
      data: {
        userId: user.id,
        name: 'Local Comercial Retiro',
        address: 'Calle Narváez 15, Bajo, Madrid',
        type: 'LOCAL',
        rooms: null,
        status: 'AVAILABLE',
        expectedRent: 1800,
        fixedExpenses: 200,
        notes: 'Local de 80m². Disponible desde marzo 2026.',
      },
    })

    const prop5 = await prisma.property.create({
      data: {
        userId: user.id,
        name: 'Piso Getafe',
        address: 'Av. Juan de la Cierva 10, 4ºC, Getafe',
        type: 'APARTMENT',
        rooms: 2,
        status: 'OCCUPIED',
        expectedRent: 850,
        fixedExpenses: 100,
        notes: 'Cerca de la universidad. Inquilinos estudiantes.',
      },
    })

    // Create tenants
    const tenant1 = await prisma.tenant.create({
      data: {
        propertyId: prop1.id,
        name: 'Marta García',
        phone: '612345678',
        email: 'marta.garcia@email.com',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-08-31'),
        rent: 1200,
        status: 'ACTIVE',
        notes: 'Muy buena inquilina. Siempre paga puntual.',
      },
    })

    const tenant2 = await prisma.tenant.create({
      data: {
        propertyId: prop2.id,
        name: 'Pedro Alias "Pete"',
        phone: '634567890',
        email: null,
        startDate: new Date('2024-10-01'),
        endDate: new Date('2025-09-30'),
        rent: 550,
        status: 'ACTIVE',
        notes: 'Trabaja de noche. Sin mascotas.',
      },
    })

    const tenant3 = await prisma.tenant.create({
      data: {
        propertyId: prop3.id,
        name: 'Lucía M.',
        phone: '645678901',
        email: 'lucia.m@email.com',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        rent: 500,
        status: 'DEFAULTER',
        notes: 'Debe 2 meses. En proceso de reclamación.',
      },
    })

    const tenant4 = await prisma.tenant.create({
      data: {
        propertyId: prop5.id,
        name: 'Antonio Ruiz',
        phone: '656789012',
        email: 'antonio.ruiz@email.com',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2025-06-30'),
        rent: 425,
        status: 'ACTIVE',
        notes: 'Comparte piso con familiar.',
      },
    })

    const tenant5 = await prisma.tenant.create({
      data: {
        propertyId: prop5.id,
        name: 'Familiar Antonio',
        phone: null,
        email: null,
        startDate: new Date('2024-07-01'),
        endDate: new Date('2025-06-30'),
        rent: 425,
        status: 'ACTIVE',
        notes: 'Familiar de Antonio. Paga parte proporcional.',
      },
    })

    // Historical tenant (finished)
    const tenant6 = await prisma.tenant.create({
      data: {
        propertyId: prop1.id,
        name: 'Roberto Fernández (anterior)',
        phone: '623456789',
        email: 'roberto.f@email.com',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2024-08-31'),
        rent: 1100,
        status: 'FINISHED',
        notes: 'Contrato finalizado. Dejó el piso en perfectas condiciones.',
      },
    })

    // Create payments for current months
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Prop1 - Paid
    const pay1 = await prisma.payment.create({
      data: {
        propertyId: prop1.id,
        month: currentMonth,
        year: currentYear,
        expectedAmount: 1200,
        paidAmount: 1200,
        dueDate: new Date(currentYear, currentMonth - 1, 5),
        paidDate: new Date(currentYear, currentMonth - 1, 3),
        status: 'PAID',
        method: 'TRANSFER',
        notes: 'Transferencia recibida puntual.',
      },
    })

    // Prop2 - Paid
    const pay2 = await prisma.payment.create({
      data: {
        propertyId: prop2.id,
        month: currentMonth,
        year: currentYear,
        expectedAmount: 550,
        paidAmount: 550,
        dueDate: new Date(currentYear, currentMonth - 1, 5),
        paidDate: new Date(currentYear, currentMonth - 1, 5),
        status: 'PAID',
        method: 'CASH',
      },
    })

    // Prop3 - UNPAID (morosa)
    const pay3 = await prisma.payment.create({
      data: {
        propertyId: prop3.id,
        month: currentMonth,
        year: currentYear,
        expectedAmount: 500,
        paidAmount: 0,
        dueDate: new Date(currentYear, currentMonth - 1, 5),
        status: 'UNPAID',
        notes: 'Morosa. Segundo mes sin pagar.',
      },
    })

    // Prop3 - previous month also UNPAID
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear
    const pay3b = await prisma.payment.create({
      data: {
        propertyId: prop3.id,
        month: prevMonth,
        year: prevYear,
        expectedAmount: 500,
        paidAmount: 200,
        dueDate: new Date(prevYear, prevMonth - 1, 5),
        status: 'PARTIAL',
        notes: 'Pagó solo 200€. Debe 300€.',
      },
    })

    // Prop5 - PENDING
    const pay5 = await prisma.payment.create({
      data: {
        propertyId: prop5.id,
        month: currentMonth,
        year: currentYear,
        expectedAmount: 850,
        paidAmount: 0,
        dueDate: new Date(currentYear, currentMonth - 1, 10),
        status: 'PENDING',
      },
    })

    // Tenant payments for prop5
    await prisma.tenantPayment.create({
      data: {
        paymentId: pay5.id,
        tenantId: tenant4.id,
        expectedAmount: 425,
        paidAmount: 0,
        status: 'PENDING',
      },
    })

    await prisma.tenantPayment.create({
      data: {
        paymentId: pay5.id,
        tenantId: tenant5.id,
        expectedAmount: 425,
        paidAmount: 0,
        status: 'PENDING',
      },
    })

    // Historical payments (previous months)
    for (let i = 1; i <= 3; i++) {
      const m = currentMonth - i <= 0 ? currentMonth - i + 12 : currentMonth - i
      const y = currentMonth - i <= 0 ? currentYear - 1 : currentYear

      await prisma.payment.create({
        data: {
          propertyId: prop1.id,
          month: m,
          year: y,
          expectedAmount: 1200,
          paidAmount: 1200,
          dueDate: new Date(y, m - 1, 5),
          paidDate: new Date(y, m - 1, 4),
          status: 'PAID',
          method: 'TRANSFER',
        },
      })

      await prisma.payment.create({
        data: {
          propertyId: prop2.id,
          month: m,
          year: y,
          expectedAmount: 550,
          paidAmount: 550,
          dueDate: new Date(y, m - 1, 5),
          paidDate: new Date(y, m - 1, 6),
          status: 'PAID',
          method: 'CASH',
        },
      })
    }

    // Create expenses
    const expenseData = [
      { propertyId: prop1.id, amount: 85, category: 'COMMUNITY', description: 'Comunidad de propietarios - Marzo 2026' },
      { propertyId: prop1.id, amount: 45, category: 'INSURANCE', description: 'Seguro multirriesgo mensual' },
      { propertyId: prop2.id, amount: 60, category: 'ELECTRICITY', description: 'Factura luz - Febrero 2026' },
      { propertyId: prop2.id, amount: 35, category: 'WATER', description: 'Agua bimestral' },
      { propertyId: prop3.id, amount: 60, category: 'ELECTRICITY', description: 'Factura luz - Febrero 2026' },
      { propertyId: prop5.id, amount: 75, category: 'COMMUNITY', description: 'Comunidad Getafe - Febrero' },
      { propertyId: prop5.id, amount: 250, category: 'REPAIR', description: 'Reparación caldera' },
      { propertyId: prop1.id, amount: 320, category: 'IBI', description: 'IBI anual prorrateado mensual' },
      { propertyId: prop4.id, amount: 200, category: 'COMMUNITY', description: 'Derrama ascensor' },
    ]

    for (const exp of expenseData) {
      await prisma.expense.create({
        data: {
          ...exp,
          date: new Date(currentYear, currentMonth - 1, Math.floor(Math.random() * 28) + 1),
        },
      })
    }

    // Create deposits
    await prisma.deposit.create({
      data: {
        propertyId: prop1.id,
        tenantId: tenant1.id,
        amount: 2400,
        deliveryDate: new Date('2024-09-01'),
        status: 'HELD',
      },
    })

    await prisma.deposit.create({
      data: {
        propertyId: prop2.id,
        tenantId: tenant2.id,
        amount: 1100,
        deliveryDate: new Date('2024-10-01'),
        status: 'HELD',
      },
    })

    await prisma.deposit.create({
      data: {
        propertyId: prop3.id,
        tenantId: tenant3.id,
        amount: 1000,
        deliveryDate: new Date('2025-01-01'),
        status: 'HELD',
      },
    })

    await prisma.deposit.create({
      data: {
        propertyId: prop5.id,
        tenantId: tenant4.id,
        amount: 850,
        deliveryDate: new Date('2024-07-01'),
        status: 'HELD',
      },
    })

    // Historical deposit - returned
    await prisma.deposit.create({
      data: {
        propertyId: prop1.id,
        tenantId: tenant6.id,
        amount: 2200,
        deliveryDate: new Date('2023-01-01'),
        status: 'RETURNED_FULL',
        returnDate: new Date('2024-09-10'),
      },
    })

    // Create incidents
    await prisma.incident.create({
      data: {
        propertyId: prop5.id,
        tenantId: tenant4.id,
        title: 'Caldera averiada',
        description: 'La caldera no enciende. Sin agua caliente.',
        category: 'BREAKDOWN',
        priority: 'HIGH',
        status: 'RESOLVED',
        cost: 250,
        openDate: new Date(currentYear, currentMonth - 2, 15),
        resolvedDate: new Date(currentYear, currentMonth - 2, 18),
      },
    })

    await prisma.incident.create({
      data: {
        propertyId: prop1.id,
        tenantId: tenant1.id,
        title: 'Goteras en el techo del baño',
        description: 'Hay filtraciones de agua del piso superior.',
        category: 'REPAIR',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        cost: null,
        openDate: new Date(currentYear, currentMonth - 1, 20),
      },
    })

    await prisma.incident.create({
      data: {
        propertyId: prop2.id,
        tenantId: tenant2.id,
        title: 'Cerradura puerta principal',
        description: 'La cerradura de la puerta principal tiene problemas.',
        category: 'REPAIR',
        priority: 'LOW',
        status: 'OPEN',
        openDate: new Date(currentYear, currentMonth - 1, 25),
      },
    })

    await prisma.incident.create({
      data: {
        propertyId: prop3.id,
        tenantId: tenant3.id,
        title: 'Ruidos nocturnos',
        description: 'Vecinos se quejan de ruidos por las noches.',
        category: 'NOISE',
        priority: 'MEDIUM',
        status: 'OPEN',
        openDate: new Date(currentYear, currentMonth - 1, 10),
      },
    })

    // Create documents (mock)
    await prisma.document.create({
      data: {
        propertyId: prop1.id,
        tenantId: tenant1.id,
        name: 'Contrato Marta García - Sep 2024',
        type: 'CONTRACT',
        url: '/documents/contrato-marta-2024.pdf',
        mimeType: 'application/pdf',
      },
    })

    await prisma.document.create({
      data: {
        propertyId: prop2.id,
        tenantId: tenant2.id,
        name: 'Contrato Pete - Oct 2024',
        type: 'CONTRACT',
        url: '/documents/contrato-pete-2024.pdf',
        mimeType: 'application/pdf',
      },
    })

    await prisma.document.create({
      data: {
        propertyId: prop1.id,
        name: 'Inventario Piso Malasaña',
        type: 'INVENTORY',
        url: '/documents/inventario-malasana.pdf',
        mimeType: 'application/pdf',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Base de datos cargada con datos de ejemplo',
      credentials: { email: 'demo@rentalmanager.es', password: 'demo1234' },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
