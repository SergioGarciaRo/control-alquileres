import { Property, Tenant, Payment, TenantPayment, Expense, Deposit, Incident, Document, Reminder } from '@prisma/client'

export type PropertyWithRelations = Property & {
  tenants: Tenant[]
  payments: Payment[]
  expenses: Expense[]
  deposits: Deposit[]
  incidents: Incident[]
  documents: Document[]
}

export type TenantWithRelations = Tenant & {
  property: Property
  tenantPayments: TenantPayment[]
  deposits: Deposit[]
  incidents: Incident[]
}

export type PaymentWithRelations = Payment & {
  property: Property
  tenantPayments: (TenantPayment & { tenant: Tenant })[]
}

export type IncidentWithRelations = Incident & {
  property: Property
  tenant?: Tenant | null
  documents: Document[]
}

export type DashboardStats = {
  totalProperties: number
  occupiedProperties: number
  availableProperties: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyNetProfit: number
  pendingPayments: number
  overduePayments: number
  openIncidents: number
  totalDebt: number
  collectionRate: number
}

export type PropertyRentability = {
  propertyId: string
  propertyName: string
  income: number
  expenses: number
  netProfit: number
  rentability: number
}

export type PaymentStatus = 'PAID' | 'PENDING' | 'PARTIAL' | 'UNPAID'
export type PropertyStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'INCIDENT'
export type TenantStatus = 'ACTIVE' | 'FINISHED' | 'DEFAULTER'
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type IncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH'
export type DepositStatus = 'HELD' | 'RETURNED_FULL' | 'RETURNED_PARTIAL' | 'RETAINED'
export type PropertyType = 'APARTMENT' | 'ROOM' | 'LOCAL'
export type ExpenseCategory = 'COMMUNITY' | 'ELECTRICITY' | 'WATER' | 'GAS' | 'INTERNET' | 'INSURANCE' | 'IBI' | 'REPAIR' | 'CLEANING' | 'OTHER'
