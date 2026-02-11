import React, { useState } from 'react';
import { Check, Sparkles, Crown, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { STRIPE_PLANS, PlanKey } from '@/lib/stripe-plans';
import { cn } from '@/lib/utils';

const planIcons: Record<PlanKey, React.ElementType> = {
  starter: Shield,
  professional: Zap,
  enterprise: Crown,
};

export default function Planos() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (planKey: PlanKey) => {
    setLoadingPlan(planKey);
    try {
      const plan = STRIPE_PLANS[planKey];
      const priceId = plan.monthly_price_id;

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error('Erro ao iniciar checkout. Tente novamente.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getMonthlyEquivalent = (plan: typeof STRIPE_PLANS[PlanKey]) => {
    if (isAnnual) {
      return Math.round(plan.annual_price / 12);
    }
    return plan.monthly_price;
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Escolha o plano ideal para sua empresa
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Todos os planos incluem <strong>14 dias de teste grátis</strong>. Cancele a qualquer momento.
        </p>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Label htmlFor="billing-toggle" className={cn("text-sm", !isAnnual && "text-foreground font-medium")}>
            Mensal
          </Label>
          <Switch
            id="billing-toggle"
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
          />
          <Label htmlFor="billing-toggle" className={cn("text-sm", isAnnual && "text-foreground font-medium")}>
            Anual
          </Label>
          {isAnnual && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
              10% de desconto
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {(Object.entries(STRIPE_PLANS) as [PlanKey, typeof STRIPE_PLANS[PlanKey]][]).map(([key, plan]) => {
          const Icon = planIcons[key];
          const isPopular = 'popular' in plan && plan.popular;
          const monthlyPrice = getMonthlyEquivalent(plan);

          return (
            <Card
              key={key}
              className={cn(
                "relative flex flex-col transition-all duration-200 hover:shadow-lg",
                isPopular && "border-primary shadow-md scale-[1.02]"
              )}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Mais popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2 pt-6">
                <div className={cn(
                  "mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl",
                  key === 'starter' && "bg-muted",
                  key === 'professional' && "bg-primary/10",
                  key === 'enterprise' && "bg-amber-100",
                )}>
                  <Icon className={cn(
                    "h-6 w-6",
                    key === 'starter' && "text-muted-foreground",
                    key === 'professional' && "text-primary",
                    key === 'enterprise' && "text-amber-600",
                  )} />
                </div>
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      {formatCurrency(monthlyPrice)}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  {isAnnual && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(plan.annual_price)} cobrado anualmente
                    </p>
                  )}
                </div>

                <div className="space-y-2.5 pt-2">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="pt-4">
                <Button
                  className="w-full"
                  variant={isPopular ? "default" : "outline"}
                  size="lg"
                  disabled={loadingPlan !== null}
                  onClick={() => handleCheckout(key)}
                >
                  {loadingPlan === key ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  ) : (
                    'Começar teste grátis'
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-sm text-muted-foreground space-y-1 max-w-lg mx-auto">
        <p>🔒 Pagamento seguro via Stripe. Seus dados estão protegidos.</p>
        <p>Sem compromisso durante o período de teste. Cancele quando quiser.</p>
      </div>
    </div>
  );
}
