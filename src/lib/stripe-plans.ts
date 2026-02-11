// Stripe product and price IDs mapping
export const STRIPE_PLANS = {
  free: {
    name: 'Free',
    product_id: '',
    monthly_price_id: '',
    monthly_price: 0,
    annual_price: 0,
    credits: 10,
    isFree: true,
    description: '14 dias grátis para conhecer a plataforma',
    features: [
      '14 dias de acesso completo',
      'Até 10 créditos IA/mês',
      'Gestão de Riscos',
      'Controles Internos',
      'Documentos',
      'Incidentes',
      'Suporte por email',
    ],
  },
  starter: {
    name: 'Starter',
    product_id: 'prod_TxZhB879BKZyBI',
    monthly_price_id: 'price_1SzeYEHrs8FLfXKfTvHzWVhP',
    monthly_price: 99,
    annual_price: 1069.20,
    credits: 10,
    isFree: false,
    description: 'Ideal para pequenas empresas',
    features: [
      'Até 10 créditos IA/mês',
      'Gestão de Riscos',
      'Controles Internos',
      'Documentos',
      'Incidentes',
      'Suporte por email',
    ],
  },
  professional: {
    name: 'Professional',
    product_id: 'prod_TxZiV0aTyVS0Vq',
    monthly_price_id: 'price_1SzeYcHrs8FLfXKfOam3UREW',
    monthly_price: 249,
    annual_price: 2689.20,
    credits: 50,
    isFree: false,
    description: 'Para empresas em crescimento',
    popular: true,
    features: [
      'Até 50 créditos IA/mês',
      'Tudo do Starter +',
      'Gap Analysis & Frameworks',
      'Due Diligence',
      'Contratos',
      'Canal de Denúncias',
      'Revisão de Acessos',
      'Integrações (Slack, Teams)',
      'Suporte prioritário',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    product_id: 'prod_TxZiZ9mPsZ1r1n',
    monthly_price_id: 'price_1SzeYwHrs8FLfXKfeJ9QjnBD',
    monthly_price: 499,
    annual_price: 5389.20,
    credits: 200,
    isFree: false,
    description: 'Governança corporativa completa',
    features: [
      'Até 200 créditos IA/mês',
      'Tudo do Professional +',
      'API Pública & Webhooks',
      'Contas Privilegiadas',
      'Auditoria Completa',
      'Multi-frameworks',
      'Relatórios avançados',
      'Onboarding dedicado',
      'Suporte 24/7',
    ],
  },
} as const;

export type PlanKey = keyof typeof STRIPE_PLANS;

export function getPlanByProductId(productId: string): PlanKey | null {
  for (const [key, plan] of Object.entries(STRIPE_PLANS)) {
    if (plan.product_id === productId) return key as PlanKey;
  }
  return null;
}
