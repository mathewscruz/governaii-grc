import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { ExternalLink, ClipboardList, Clock, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { logger } from '@/lib/logger';

interface RemediationTabProps {
  frameworkId: string;
  frameworkName: string;
}

interface PlanoAcao {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  prioridade: string;
  prazo: string | null;
  responsavel_id: string | null;
  responsavel_nome: string | null;
  requirement_codigo: string;
  requirement_titulo: string;
}

export const RemediationTab: React.FC<RemediationTabProps> = ({ frameworkId, frameworkName }) => {
  const { profile } = useAuth();
  const empresaId = profile?.empresa_id;
  const navigate = useNavigate();
  const [planos, setPlanos] = useState<PlanoAcao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!empresaId || !frameworkId) return;
    loadPlanos();
  }, [empresaId, frameworkId]);

  const loadPlanos = async () => {
    setLoading(true);
    try {
      const { data: evals, error: evalError } = await supabase
        .from('gap_analysis_evaluations')
        .select('plano_acao_id, requirement_id')
        .eq('framework_id', frameworkId)
        .eq('empresa_id', empresaId!)
        .not('plano_acao_id', 'is', null);

      if (evalError) throw evalError;
      if (!evals || evals.length === 0) {
        setPlanos([]);
        setLoading(false);
        return;
      }

      const planoIds = evals.map(e => e.plano_acao_id).filter(Boolean) as string[];
      const reqIds = evals.map(e => e.requirement_id);

      const [planosRes, reqsRes] = await Promise.all([
        supabase.from('planos_acao').select('id, titulo, descricao, status, prioridade, prazo, responsavel_id').in('id', planoIds),
        supabase.from('gap_analysis_requirements').select('id, codigo, titulo').in('id', reqIds),
      ]);

      // Resolve responsavel names
      const responsavelIds = (planosRes.data || [])
        .map(p => p.responsavel_id)
        .filter(Boolean) as string[];

      let profileMap = new Map<string, string>();
      if (responsavelIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', responsavelIds);
        (profiles || []).forEach(p => profileMap.set(p.user_id, p.nome));
      }

      const reqMap = new Map((reqsRes.data || []).map(r => [r.id, r]));
      const evalMap = new Map(evals.map(e => [e.plano_acao_id, e.requirement_id]));

      const merged: PlanoAcao[] = (planosRes.data || []).map(p => {
        const reqId = evalMap.get(p.id);
        const req = reqId ? reqMap.get(reqId) : null;
        return {
          ...p,
          responsavel_nome: p.responsavel_id ? (profileMap.get(p.responsavel_id) || null) : null,
          requirement_codigo: req?.codigo || '',
          requirement_titulo: req?.titulo || '',
        };
      });

      setPlanos(merged);
    } catch (error) {
      logger.error('Erro ao carregar planos de remediação:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'outline' | 'secondary' }> = {
      concluido: { label: 'Concluído', variant: 'success' },
      em_andamento: { label: 'Em Andamento', variant: 'warning' },
      pendente: { label: 'Pendente', variant: 'destructive' },
      cancelado: { label: 'Cancelado', variant: 'outline' },
      atrasado: { label: 'Atrasado', variant: 'destructive' },
    };
    const s = map[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const map: Record<string, { label: string; variant: 'destructive' | 'warning' | 'outline' | 'secondary' }> = {
      critica: { label: 'Crítica', variant: 'destructive' },
      alta: { label: 'Alta', variant: 'destructive' },
      media: { label: 'Média', variant: 'warning' },
      baixa: { label: 'Baixa', variant: 'outline' },
    };
    const s = map[prioridade] || { label: prioridade, variant: 'secondary' as const };
    return <Badge variant={s.variant} className="text-xs">{s.label}</Badge>;
  };

  const pendentes = planos.filter(p => p.status === 'pendente').length;
  const emAndamento = planos.filter(p => p.status === 'em_andamento').length;
  const concluidos = planos.filter(p => p.status === 'concluido').length;
  const atrasados = planos.filter(p => p.prazo && new Date(p.prazo) < new Date() && p.status !== 'concluido' && p.status !== 'cancelado').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" strokeWidth={1.5}/>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Pendentes" value={pendentes} icon={<Clock className="h-4 w-4" strokeWidth={1.5}/>} />
        <StatCard title="Em Andamento" value={emAndamento} icon={<ClipboardList className="h-4 w-4" strokeWidth={1.5}/>} />
        <StatCard title="Concluídos" value={concluidos} icon={<CheckCircle2 className="h-4 w-4" strokeWidth={1.5}/>} />
        <StatCard title="Atrasados" value={atrasados} icon={<AlertTriangle className="h-4 w-4" strokeWidth={1.5}/>} />
      </div>

      {planos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" strokeWidth={1.5}/>
            <p className="text-lg font-medium text-muted-foreground">Nenhum plano de ação vinculado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Para criar planos de remediação, marque requisitos como "Não Conforme" e crie planos de ação no detalhe do requisito.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Planos de Ação — {frameworkName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {planos.map(plano => (
              <div key={plano.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-muted-foreground">{plano.requirement_codigo}</span>
                    {getStatusBadge(plano.status)}
                    {getPrioridadeBadge(plano.prioridade)}
                  </div>
                  <p className="text-sm font-medium truncate">{plano.titulo}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {plano.responsavel_id && (
                      <span>Resp: {plano.responsavel_nome || 'Não identificado'}</span>
                    )}
                    {plano.prazo && (
                      <span className={new Date(plano.prazo) < new Date() && plano.status !== 'concluido' ? 'text-destructive font-medium' : ''}>
                        Prazo: {new Date(plano.prazo).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => navigate('/planos-acao')}>
                  <ExternalLink className="h-4 w-4" strokeWidth={1.5}/>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
