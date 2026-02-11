import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, XCircle, Send, Webhook, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WebhooksConfigDialogProps {
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
  { id: 'incidente_criado', label: 'Incidente criado', modulo: 'Incidentes' },
  { id: 'incidente_atualizado', label: 'Incidente atualizado', modulo: 'Incidentes' },
  { id: 'incidente_resolvido', label: 'Incidente resolvido', modulo: 'Incidentes' },
  { id: 'risco_identificado', label: 'Risco identificado', modulo: 'Riscos' },
  { id: 'risco_atualizado', label: 'Risco atualizado', modulo: 'Riscos' },
  { id: 'documento_criado', label: 'Documento criado', modulo: 'Documentos' },
  { id: 'documento_aprovado', label: 'Documento aprovado', modulo: 'Documentos' },
  { id: 'documento_rejeitado', label: 'Documento rejeitado', modulo: 'Documentos' },
  { id: 'controle_criado', label: 'Controle criado', modulo: 'Controles' },
  { id: 'controle_atualizado', label: 'Controle atualizado', modulo: 'Controles' },
  { id: 'auditoria_criada', label: 'Auditoria criada', modulo: 'Auditorias' },
  { id: 'auditoria_item_atribuido', label: 'Item de auditoria atribuído', modulo: 'Auditorias' },
  { id: 'denuncia_recebida', label: 'Denúncia recebida', modulo: 'Denúncias' },
];

const PAYLOAD_EXEMPLO = `{
  "evento": "incidente_criado",
  "timestamp": "2025-01-01T12:00:00Z",
  "dados": {
    "id": "uuid",
    "titulo": "Título do incidente",
    "gravidade": "alta",
    "status": "aberto"
  },
  "empresa_id": "uuid"
}`;

export function WebhooksConfigDialog({
  open,
  onOpenChange,
  empresaId,
  existingConfig,
  onSaved
}: WebhooksConfigDialogProps) {
  const [webhookUrl, setWebhookUrl] = useState(existingConfig?.webhook_url || '');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(
    (existingConfig?.configuracoes?.eventos as string[]) || []
  );
  const [customHeaders, setCustomHeaders] = useState<{ key: string; value: string }[]>(
    (existingConfig?.configuracoes?.headers as { key: string; value: string }[]) || []
  );
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

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
          tipo: 'webhook',
          webhook_url: webhookUrl,
          headers: customHeaders.reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {})
        }
      });

      if (error) throw error;

      if (data?.success) {
        setTestResult('success');
        toast.success('Webhook testado!', {
          description: 'Payload de teste enviado com sucesso.'
        });
      } else {
        throw new Error(data?.error || 'Falha no teste');
      }
    } catch (error: any) {
      setTestResult('error');
      toast.error('Falha no teste', {
        description: error.message || 'Verifique a URL e headers.'
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

    if (selectedEvents.length === 0) {
      toast.error('Eventos obrigatórios', { description: 'Selecione ao menos um evento.' });
      return;
    }

    setSaving(true);
    try {
      const configData = {
        empresa_id: empresaId,
        tipo_integracao: 'webhooks',
        nome_exibicao: 'Webhooks',
        webhook_url: webhookUrl,
        status: 'conectado',
        configuracoes: { 
          eventos: selectedEvents,
          headers: customHeaders.filter(h => h.key && h.value)
        }
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

      toast.success('Webhook configurado!', {
        description: 'Eventos serão enviados para a URL configurada.'
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

      toast.success('Webhook removido');
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Erro ao remover', { description: error.message });
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

  const addHeader = () => {
    setCustomHeaders(prev => [...prev, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    setCustomHeaders(prev => prev.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    setCustomHeaders(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-primary" />
            Configurar Webhooks
          </DialogTitle>
          <DialogDescription>
            Receba eventos do Akuris via HTTP POST em qualquer sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Webhook URL */}
          <div className="space-y-2">
            <Label htmlFor="webhook-url">URL do Webhook *</Label>
            <div className="flex gap-2">
              <Input
                id="webhook-url"
                placeholder="https://seu-sistema.com/webhook"
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
              <p className="text-xs text-green-600">✓ Webhook testado com sucesso</p>
            )}
            {testResult === 'error' && (
              <p className="text-xs text-destructive">✗ Falha no teste - verifique a URL</p>
            )}
          </div>

          {/* Headers personalizados */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Headers Personalizados</Label>
              <Button variant="outline" size="sm" onClick={addHeader}>
                <Plus className="h-3 w-3 mr-1" />
                Adicionar
              </Button>
            </div>
            {customHeaders.length > 0 && (
              <div className="space-y-2">
                {customHeaders.map((header, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Header (ex: Authorization)"
                      value={header.key}
                      onChange={(e) => updateHeader(index, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Valor (ex: Bearer token...)"
                      value={header.value}
                      onChange={(e) => updateHeader(index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeHeader(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Eventos */}
          <div className="space-y-3">
            <Label>Eventos para enviar *</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
              {EVENTOS_DISPONIVEIS.map(evento => (
                <div
                  key={evento.id}
                  className="flex items-center gap-2"
                >
                  <Checkbox
                    id={`wh-${evento.id}`}
                    checked={selectedEvents.includes(evento.id)}
                    onCheckedChange={() => toggleEvent(evento.id)}
                  />
                  <label
                    htmlFor={`wh-${evento.id}`}
                    className="text-xs cursor-pointer flex-1"
                  >
                    {evento.label}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedEvents.length} evento(s) selecionado(s)
            </p>
          </div>

          {/* Exemplo de payload */}
          <div className="space-y-2">
            <Label>Exemplo de Payload</Label>
            <Textarea
              value={PAYLOAD_EXEMPLO}
              readOnly
              className="font-mono text-xs h-36"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {existingConfig && (
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={saving}
              className="sm:mr-auto"
            >
              Remover
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !webhookUrl || selectedEvents.length === 0}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
