import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, ExternalLink, Send, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TeamsConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string;
  existingConfig?: {
    id: string;
    webhook_url: string | null;
    configuracoes: Record<string, unknown>;
    status: string;
  };
  onSaved: () => void;
}

const EVENTOS_DISPONIVEIS = [
  { id: 'incidente_criado', label: 'Novo incidente criado', modulo: 'Incidentes' },
  { id: 'incidente_critico', label: 'Incidente crítico detectado', modulo: 'Incidentes' },
  { id: 'risco_identificado', label: 'Novo risco identificado', modulo: 'Riscos' },
  { id: 'risco_nivel_alterado', label: 'Nível de risco alterado', modulo: 'Riscos' },
  { id: 'documento_aprovado', label: 'Documento aprovado', modulo: 'Documentos' },
  { id: 'documento_rejeitado', label: 'Documento rejeitado', modulo: 'Documentos' },
  { id: 'controle_vencendo', label: 'Controle próximo do vencimento', modulo: 'Controles' },
  { id: 'auditoria_item_atribuido', label: 'Item de auditoria atribuído', modulo: 'Auditorias' },
  { id: 'denuncia_recebida', label: 'Nova denúncia recebida', modulo: 'Denúncias' },
];

const TeamsLogoInline = () => (
  <svg viewBox="0 0 48 48" className="h-6 w-6">
    <path fill="#5059C9" d="M44 22v10c0 2.2-1.8 4-4 4h-4V18h4C42.2 18 44 19.8 44 22z"/>
    <circle fill="#5059C9" cx="36" cy="12" r="4"/>
    <circle fill="#7B83EB" cx="28" cy="10" r="6"/>
    <path fill="#7B83EB" d="M36 18H20c-2.2 0-4 1.8-4 4v14c0 5.5 4.5 10 10 10s10-4.5 10-10V22C36 19.8 34.2 18 32 18z"/>
  </svg>
);

export function TeamsConfigDialog({
  open,
  onOpenChange,
  empresaId,
  existingConfig,
  onSaved
}: TeamsConfigDialogProps) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(EVENTOS_DISPONIVEIS.map(e => e.id));
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // Reset state when dialog opens or existingConfig changes
  useEffect(() => {
    if (open) {
      setWebhookUrl(existingConfig?.webhook_url || '');
      setSelectedEvents(
        (existingConfig?.configuracoes?.eventos as string[]) || EVENTOS_DISPONIVEIS.map(e => e.id)
      );
      setTestResult(null);
      setSaving(false);
      setTesting(false);
    }
  }, [open, existingConfig]);

  const handleTestConnection = async () => {
    if (!webhookUrl) {
      toast.error('URL obrigatória', { description: 'Informe a URL do webhook.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-integration-connection', {
        body: {
          tipo: 'teams',
          webhook_url: webhookUrl
        }
      });

      if (error) throw error;

      if (data?.success) {
        setTestResult('success');
        toast.success('Conexão bem-sucedida!', {
          description: 'Mensagem de teste enviada para o Teams.'
        });
      } else {
        throw new Error(data?.error || 'Falha no teste');
      }
    } catch (error: any) {
      setTestResult('error');
      toast.error('Falha na conexão', {
        description: error.message || 'Verifique a URL do webhook.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!webhookUrl) {
      toast.error('URL obrigatória', { description: 'Informe a URL do webhook.' });
      return;
    }

    setSaving(true);
    try {
      const configData = {
        empresa_id: empresaId,
        tipo_integracao: 'teams',
        nome_exibicao: 'Microsoft Teams',
        webhook_url: webhookUrl,
        status: 'conectado',
        configuracoes: { eventos: selectedEvents }
      };

      if (existingConfig?.id) {
        const { error } = await supabase
          .from('integracoes_config')
          .update({
            ...configData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('integracoes_config')
          .insert(configData);
        if (error) throw error;
      }

      toast.success('Teams configurado!', {
        description: 'Você receberá notificações no canal configurado.'
      });
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Erro ao salvar', { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!existingConfig?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('integracoes_config')
        .delete()
        .eq('id', existingConfig.id);
      if (error) throw error;

      toast.success('Teams desconectado');
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Erro ao desconectar', { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TeamsLogoInline />
            Configurar Microsoft Teams
          </DialogTitle>
          <DialogDescription>
            Receba notificações do Akuris diretamente no seu canal do Teams.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Instruções */}
          <div className="p-3 rounded-lg bg-muted/50 border space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              Como configurar
            </h4>
            <ol className="text-xs text-muted-foreground space-y-1 ml-6 list-decimal">
              <li>Abra o canal do Teams onde deseja receber notificações</li>
              <li>Clique em "..." → "Conectores"</li>
              <li>Busque por "Incoming Webhook" e configure</li>
              <li>Dê um nome (ex: Akuris) e copie a URL</li>
              <li>Cole a URL abaixo e teste a conexão</li>
            </ol>
          </div>

          {/* Webhook URL */}
          <div className="space-y-2">
            <Label htmlFor="teams-webhook">URL do Incoming Webhook *</Label>
            <div className="flex gap-2">
              <Input
                id="teams-webhook"
                placeholder="https://outlook.office.com/webhook/..."
                value={webhookUrl}
                onChange={(e) => {
                  setWebhookUrl(e.target.value);
                  setTestResult(null);
                }}
                disabled={saving}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleTestConnection}
                disabled={testing || !webhookUrl || saving}
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : testResult === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : testResult === 'error' ? (
                  <XCircle className="h-4 w-4 text-destructive" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {testResult === 'success' && (
              <p className="text-xs text-green-600">✓ Conexão verificada com sucesso</p>
            )}
            {testResult === 'error' && (
              <p className="text-xs text-destructive">✗ Falha na conexão - verifique a URL</p>
            )}
          </div>

          {/* Eventos */}
          <div className="space-y-3">
            <Label>Eventos para notificar</Label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {EVENTOS_DISPONIVEIS.map(evento => (
                <div
                  key={evento.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                >
                  <Checkbox
                    id={`teams-${evento.id}`}
                    checked={selectedEvents.includes(evento.id)}
                    onCheckedChange={() => toggleEvent(evento.id)}
                    disabled={saving}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`teams-${evento.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {evento.label}
                    </label>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {evento.modulo}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Link documentação */}
          <a
            href="https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Ver documentação do Teams
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {existingConfig && (
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={saving}
              className="sm:mr-auto"
            >
              Desconectar
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !webhookUrl}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
