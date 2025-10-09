import type { PrismaClient, subscriptions } from '@prisma/client'
import { Plan, Role, SubStatus } from '@prisma/client'
import type { ViewerContext } from './viewer-context'

export type SubscriptionPlan = 'STARTER' | 'PRO' | 'AGENCY'

const PRO_PLANS: SubscriptionPlan[] = ['PRO', 'AGENCY']
const ACTIVE_STATUSES: SubStatus[] = [SubStatus.ACTIVE, SubStatus.PAST_DUE]

export function getSubscriptionPlan(): SubscriptionPlan {
  const hint = process.env.BILLING_DEMO_PLAN?.toUpperCase()
  if (hint === 'PRO' || hint === 'AGENCY') {
    return hint
  }
  return 'STARTER'
}

export function hasProAccess(plan: SubscriptionPlan): boolean {
  return PRO_PLANS.includes(plan)
}

export function getPlanLabel(plan: SubscriptionPlan): string {
  if (plan === 'AGENCY') return 'Agency'
  if (plan === 'PRO') return 'Pro'
  return 'Starter'
}

type SubscriptionRecord = Pick<
  subscriptions,
  'plan' | 'status' | 'agency_id' | 'user_id'
>

function planFromRecord(record: SubscriptionRecord | null): SubscriptionPlan | null {
  if (!record) return null
  if (!ACTIVE_STATUSES.includes(record.status)) return null
  if (record.plan === Plan.AGENCY) return 'AGENCY'
  if (record.plan === Plan.PRO) return 'PRO'
  if (record.plan === Plan.STARTER) return 'STARTER'
  return null
}

function fallbackPlan(): SubscriptionPlan {
  return getSubscriptionPlan()
}

export async function resolveSubscriptionPlan(
  prisma: PrismaClient,
  context: ViewerContext | null,
): Promise<SubscriptionPlan> {
  if (!context) {
    return fallbackPlan()
  }

  if (context.role === Role.ADMIN) {
    return 'AGENCY'
  }

  const where =
    context.role === Role.AGENCY && 'agencyId' in context
      ? { agency_id: context.agencyId }
      : { user_id: context.userId }

  const record = await prisma.subscriptions.findFirst({
    where: {
      ...where,
      status: { in: ACTIVE_STATUSES },
    },
    orderBy: {
      current_period_end: 'desc',
    },
  })

  return planFromRecord(record) ?? fallbackPlan()
}
