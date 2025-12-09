import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDateOnly } from '@/lib/date-utils';

interface WebhookLog {
  id: string;
  integracao_id: string;
  evento: string;
  payload: any;
  status_code: number;
  resposta: string;
  sucesso: boolean;
  created_at: string;
}

interface IntegrationLogViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IntegrationLogViewer({ open, onOpenChange }: IntegrationLogViewerProps) {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('user_id', userData.user.id)
        .single();

      if (!profile?.empresa_id) return;

      const { data, error } = await supabase
        .from('integracoes_webhook_logs')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs((data || []).map(d => ({
        id: d.id,
        integracao_id: d.integracao_id,
        evento: d.evento,
        payload: d.payload,
        status_code: d.status_code,
        resposta: d.resposta,
        sucesso: d.sucesso,
        created_at: d.created_at
      })));
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${formatDateOnly(dateString)} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  };

  const getStatusIcon = (success: boolean) => {
    if (success) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getEventLabel = (evento: string) => {
    const labels: Record<string, string> = {
      incidente_criado: 'Incidente Criado',
      incidente_atualizado: 'Incidente Atualizado',
      incidente_resolvido: 'Incidente Resolvido',
      incidente_critico: 'Incidente Crítico',
      risco_identificado: 'Risco Identificado',
      risco_atualizado: 'Risco Atualizado',
      risco_nivel_alterado: 'Nível de Risco Alterado',
      documento_criado: 'Documento Criado',
      documento_aprovado: 'Documento Aprovado',
      documento_rejeitado: 'Documento Rejeitado',
      controle_criado: 'Controle Criado',
      controle_atualizado: 'Controle Atualizado',
      controle_vencendo: 'Controle Vencendo',
      auditoria_criada: 'Auditoria Criada',
      auditoria_item_atribuido: 'Item de Auditoria Atribuído',
      denuncia_recebida: 'Denúncia Recebida'
    };
    return labels[evento] || evento;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Logs de Integrações
          </DialogTitle>
          <DialogDescription>
            Histórico de notificações enviadas para integrações externas
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        <ScrollArea className="h-[500px] pr-4">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum log de integração encontrado</p>
              <p className="text-sm">Os logs aparecerão aqui quando eventos forem disparados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(log.sucesso)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{getEventLabel(log.evento)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(log.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={log.sucesso ? 'default' : 'destructive'}>
                        HTTP {log.status_code || 'N/A'}
                      </Badge>
                    </div>
                  </div>

                  {log.payload && (
                    <div className="mt-3 p-2 bg-muted rounded text-xs font-mono overflow-x-auto">
                      <strong>Payload:</strong> {typeof log.payload === 'object' ? (log.payload.titulo || JSON.stringify(log.payload).substring(0, 100)) : String(log.payload).substring(0, 100)}...
                    </div>
                  )}

                  {!log.sucesso && log.resposta && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 rounded text-xs text-red-600 dark:text-red-400">
                      <strong>Erro:</strong> {log.resposta.substring(0, 200)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
