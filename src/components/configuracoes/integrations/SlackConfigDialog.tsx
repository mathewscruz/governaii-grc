import { useState, useEffect } from 'react';
import { DialogShell } from '@/components/ui/dialog-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, ExternalLink, Send, AlertCircle, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SlackConfigDialogProps {
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

import { INTEGRATION_EVENTS } from '@/lib/integration-events';

import { AkurisPulse } from '@/components/ui/AkurisPulse';
const EVENTOS_DISPONIVEIS = INTEGRATION_EVENTS;

export function SlackConfigDialog({
  open,
  onOpenChange,
  empresaId,
  existingConfig,
  onSaved
}: SlackConfigDialogProps) {
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
          tipo: 'slack',
          webhook_url: webhookUrl
        }
      });

      if (error) throw error;

      if (data?.success) {
        setTestResult('success');
        toast.success('Conexão bem-sucedida!', {
          description: 'Mensagem de teste enviada para o Slack.'
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
        tipo_integracao: 'slack',
        nome_exibicao: 'Slack',
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

      toast.success('Slack configurado!', {
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

      toast.success('Slack desconectado');
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

  const footer = (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      {existingConfig && (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDisconnect}
          disabled={saving}
          className="sm:mr-auto"
        >
          Desconectar
        </Button>
      )}
      <div className="flex gap-2 sm:ml-auto">
        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
          Cancelar
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving || !webhookUrl}>
          {saving && <AkurisPulse size={16} className="mr-2" />}
          Salvar
        </Button>
      </div>
    </div>
  );

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Configurar Slack"
      description="Receba notificações do Akuris diretamente no seu canal do Slack."
      icon={MessageSquare}
      size="md"
      footer={footer}
      onSubmit={handleSave}
      isDirty={!!webhookUrl && webhookUrl !== (existingConfig?.webhook_url || '')}
    >
      <div className="space-y-6">
          {/* Instruções */}
          <div className="p-3 rounded-lg bg-muted/50 border space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              Como configurar
            </h4>
            <ol className="text-xs text-muted-foreground space-y-1 ml-6 list-decimal">
              <li>Acesse seu Slack Workspace</li>
              <li>Vá em Apps → Incoming Webhooks</li>
              <li>Clique em "Add New Webhook to Workspace"</li>
              <li>Selecione o canal e copie a URL</li>
              <li>Cole a URL abaixo e teste a conexão</li>
            </ol>
          </div>

          {/* Webhook URL */}
          <div className="space-y-2">
            <Label htmlFor="slack-webhook">URL do Incoming Webhook *</Label>
            <div className="flex gap-2">
              <Input
                id="slack-webhook"
                placeholder="https://hooks.slack.com/services/..."
                value={webhookUrl}
                onChange={(e) => {
                  setWebhookUrl(e.target.value);
                  setTestResult(null);
                }}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleTestConnection}
                disabled={testing || !webhookUrl}
              >
                {testing ? (
                  <AkurisPulse size={16} />
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
                    id={evento.id}
                    checked={selectedEvents.includes(evento.id)}
                    onCheckedChange={() => toggleEvent(evento.id)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={evento.id}
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
            href="https://api.slack.com/messaging/webhooks"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Ver documentação do Slack
            <ExternalLink className="h-3 w-3" />
          </a>
      </div>
    </DialogShell>
  );
}
