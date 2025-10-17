import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { FileText, AlertTriangle, Shield, Users, Calendar, Building } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  created_at: string;
  module: string;
  icon: React.ReactNode;
  status?: string;
}

export function RecentActivities() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchRecentActivities();
    }
  }, [profile]);

  const getIcon = (module: string) => {
    switch (module) {
      case 'riscos': return <AlertTriangle className="h-4 w-4" />;
      case 'controles': return <Shield className="h-4 w-4" />;
      case 'documentos': return <FileText className="h-4 w-4" />;
      case 'auditorias': return <Calendar className="h-4 w-4" />;
      case 'usuarios': return <Users className="h-4 w-4" />;
      case 'contratos': return <Building className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (module: string, status?: string) => {
    if (!status) return null;
    
    const statusMap: Record<string, { 
      variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "neutral", 
      label: string 
    }> = {
      // Níveis de Risco
      'critico': { variant: 'destructive', label: 'Crítico' },
      'alto': { variant: 'destructive', label: 'Alto' },
      'medio': { variant: 'warning', label: 'Médio' },
      'médio': { variant: 'warning', label: 'Médio' },
      'baixo': { variant: 'success', label: 'Baixo' },
      
      // Status de Controles/Ativos/Documentos
      'ativo': { variant: 'success', label: 'Ativo' },
      'inativo': { variant: 'neutral', label: 'Inativo' },
      'vencido': { variant: 'destructive', label: 'Vencido' },
      'em_avaliacao': { variant: 'warning', label: 'Em Avaliação' },
      
      // Status de Aprovação
      'pendente': { variant: 'warning', label: 'Pendente' },
      'pendente_aprovacao': { variant: 'warning', label: 'Pendente Aprovação' },
      'aprovado': { variant: 'success', label: 'Aprovado' },
      'rejeitado': { variant: 'destructive', label: 'Rejeitado' },
      
      // Status de Auditorias
      'planejada': { variant: 'warning', label: 'Planejada' },
      'em_andamento': { variant: 'info', label: 'Em Andamento' },
      'em_analise': { variant: 'info', label: 'Em Análise' },
      'em_investigacao': { variant: 'info', label: 'Em Investigação' },
      'concluida': { variant: 'success', label: 'Concluída' },
      'concluído': { variant: 'success', label: 'Concluído' },
      'concluido': { variant: 'success', label: 'Concluído' },
      'cancelada': { variant: 'neutral', label: 'Cancelada' },
      
      // Status de Denúncias
      'nova': { variant: 'info', label: 'Nova' },
      'resolvida': { variant: 'success', label: 'Resolvida' },
      'arquivada': { variant: 'neutral', label: 'Arquivada' }
    };

    const normalizedStatus = status.toLowerCase().trim();
    const statusInfo = statusMap[normalizedStatus] || { 
      variant: 'outline' as const, 
      label: status.charAt(0).toUpperCase() + status.slice(1) // Capitalizar qualquer status desconhecido
    };
    
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const handleActivityClick = (activity: Activity) => {
    const routeMap: Record<string, string> = {
      'riscos': '/riscos',
      'controles': '/controles',
      'documentos': '/documentos',
      'auditorias': '/auditorias',
      'denuncias': '/denuncia'
    };

    const route = routeMap[activity.module];
    if (route) {
      // Extrair o ID real do formato "module-id"
      const itemId = activity.id.split('-')[1];
      navigate(route, { state: { itemId } });
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const activities: Activity[] = [];

      // Riscos recentes
      const { data: riscos } = await supabase
        .from('riscos')
        .select('id, nome, nivel_risco_inicial, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      riscos?.forEach(risco => {
        activities.push({
          id: `risco-${risco.id}`,
          type: 'creation',
          title: risco.nome,
          description: 'Novo risco identificado',
          created_at: risco.created_at,
          module: 'riscos',
          icon: getIcon('riscos'),
          status: risco.nivel_risco_inicial
        });
      });

      // Controles recentes
      const { data: controles } = await supabase
        .from('controles')
        .select('id, nome, status, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      controles?.forEach(controle => {
        activities.push({
          id: `controle-${controle.id}`,
          type: 'creation',
          title: controle.nome,
          description: 'Novo controle implementado',
          created_at: controle.created_at,
          module: 'controles',
          icon: getIcon('controles'),
          status: controle.status
        });
      });

      // Documentos recentes
      const { data: documentos } = await supabase
        .from('documentos')
        .select('id, nome, status, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      documentos?.forEach(documento => {
        activities.push({
          id: `documento-${documento.id}`,
          type: 'creation',
          title: documento.nome,
          description: 'Documento adicionado',
          created_at: documento.created_at,
          module: 'documentos',
          icon: getIcon('documentos'),
          status: documento.status
        });
      });

      // Auditorias recentes
      const { data: auditorias } = await supabase
        .from('auditorias')
        .select('id, nome, status, created_at')
        .order('created_at', { ascending: false })
        .limit(2);

      auditorias?.forEach(auditoria => {
        activities.push({
          id: `auditoria-${auditoria.id}`,
          type: 'creation',
          title: auditoria.nome,
          description: 'Nova auditoria iniciada',
          created_at: auditoria.created_at,
          module: 'auditorias',
          icon: getIcon('auditorias'),
          status: auditoria.status
        });
      });

      // Denúncias recentes
      const { data: denuncias } = await supabase
        .from('denuncias')
        .select('id, titulo, status, created_at')
        .order('created_at', { ascending: false })
        .limit(2);

      denuncias?.forEach(denuncia => {
        activities.push({
          id: `denuncia-${denuncia.id}`,
          type: 'creation',
          title: denuncia.titulo,
          description: 'Nova denúncia recebida',
          created_at: denuncia.created_at,
          module: 'denuncias',
          icon: getIcon('usuarios'),
          status: denuncia.status
        });
      });

      // Ordenar por data mais recente e limitar a 10
      const sortedActivities = activities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setActivities(sortedActivities);
    } catch (error) {
      console.error('Erro ao carregar atividades recentes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Atividades Recentes</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start space-x-3 p-3 rounded-lg border bg-card/50 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleActivityClick(activity)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleActivityClick(activity)}
              >
                <div className="flex-shrink-0 mt-1">
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground truncate">
                      {activity.title}
                    </p>
                    {activity.status && getStatusBadge(activity.module, activity.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
              <Calendar className="h-12 w-12" />
            </div>
            <p className="text-muted-foreground">
              Nenhuma atividade recente encontrada
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}