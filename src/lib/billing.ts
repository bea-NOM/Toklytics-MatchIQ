export type SubscriptionPlan = 'STARTER' | 'PRO' | 'AGENCY'

const PRO_PLANS: SubscriptionPlan[] = ['PRO', 'AGENCY']

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
