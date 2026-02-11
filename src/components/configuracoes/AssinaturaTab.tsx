import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Crown, Shield, Zap, ExternalLink, CreditCard, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { STRIPE_PLANS, PlanKey, getPlanByProductId } from '@/lib/stripe-plans';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const planIcons: Record<PlanKey, React.ElementType> = {
  starter: Shield,
  professional: Zap,
  enterprise: Crown,
};

export function AssinaturaTab() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const navigate = useNavigate();

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, []);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Portal error:', error);
      toast.error('Erro ao abrir portal de gerenciamento.');
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentPlanKey = subscription?.product_id 
    ? getPlanByProductId(subscription.product_id) 
    : null;
  const currentPlan = currentPlanKey ? STRIPE_PLANS[currentPlanKey] : null;
  const CurrentIcon = currentPlanKey ? planIcons[currentPlanKey] : Shield;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Assinatura</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie seu plano e informações de pagamento.
        </p>
      </div>

      {subscription?.subscribed ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  currentPlanKey === 'starter' && "bg-muted",
                  currentPlanKey === 'professional' && "bg-primary/10",
                  currentPlanKey === 'enterprise' && "bg-amber-100",
                )}>
                  <CurrentIcon className={cn(
                    "h-5 w-5",
                    currentPlanKey === 'starter' && "text-muted-foreground",
                    currentPlanKey === 'professional' && "text-primary",
                    currentPlanKey === 'enterprise' && "text-amber-600",
                  )} />
                </div>
                <div>
                  <CardTitle className="text-base">
                    Plano {currentPlan?.name || 'Ativo'}
                  </CardTitle>
                  {subscription.is_trialing && (
                    <Badge variant="secondary" className="mt-1 bg-blue-100 text-blue-700 border-blue-200">
                      Período de teste
                    </Badge>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="border-green-500 text-green-600">
                Ativo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentPlan && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Valor mensal</p>
                    <p className="text-sm font-medium">R$ {currentPlan.monthly_price}/mês</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Créditos IA</p>
                    <p className="text-sm font-medium">{currentPlan.credits}/mês</p>
                  </div>
                </div>
                {subscription.subscription_end && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {subscription.is_trialing ? 'Trial até' : 'Próxima cobrança'}
                      </p>
                      <p className="text-sm font-medium">
                        {new Date(subscription.is_trialing ? subscription.trial_end : subscription.subscription_end).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Separator />

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Gerenciar assinatura
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/planos')}
              >
                Ver todos os planos
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <CreditCard className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-foreground">Nenhum plano ativo</h4>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Escolha um plano para desbloquear todos os recursos do Akuris. 
                Todos os planos incluem 14 dias de teste grátis.
              </p>
            </div>
            <Button onClick={() => navigate('/planos')} size="lg">
              Ver planos disponíveis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
