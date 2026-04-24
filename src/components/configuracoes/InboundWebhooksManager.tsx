import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DialogShell } from '@/components/ui/dialog-shell';
import { Button as _Btn } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { Webhook, Plus, Copy, Trash2, Loader2, Send, Code } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

interface InboundWebhook {
  id: string;
  nome: string;
  descricao: string | null;
  webhook_token: string;
  tipo_evento: string;
  modulo_destino: string;
  mapeamento_campos: Record<string, string>;
  ativo: boolean;
  total_recebidos: number;
  ultimo_recebimento: string | null;
  created_at: string;
}

const MODULOS_DESTINO = [
  { value: 'incidentes', label: 'Incidentes de Segurança' },
  { value: 'riscos', label: 'Riscos' },
  { value: 'ativos', label: 'Ativos' },
  { value: 'controles', label: 'Controles Internos' },
  { value: 'denuncias', label: 'Denúncias' },
];

const TIPOS_EVENTO = [
  { value: 'siem_alert', label: 'Alerta de SIEM' },
  { value: 'vulnerability_scan', label: 'Scan de Vulnerabilidade' },
  { value: 'asset_discovery', label: 'Descoberta de Ativos' },
  { value: 'compliance_finding', label: 'Achado de Compliance' },
  { value: 'custom', label: 'Evento Customizado' },
];

const PAYLOAD_EXAMPLES: Record<string, object> = {
  incidentes: {
    title: "Alerta de Intrusão Detectado",
    description: "Tentativa de acesso não autorizado ao servidor de produção",
    severity: "critical",
    type: "seguranca",
    source: "SIEM-Splunk"
  },
  riscos: {
    title: "Vulnerabilidade CVE-2024-1234",
    description: "Vulnerabilidade crítica detectada no componente X",
    severity: "high",
    category: "Tecnologia",
    probability: "Possível",
    impact: "Alto"
  },
  ativos: {
    name: "DESKTOP-NEW001",
    type: "Servidor",
    description: "Novo servidor detectado na rede",
    hostname: "srv-prod-05"
  },
  controles: {
    title: "Verificação de Firewall",
    description: "Controle de monitoramento de regras de firewall",
    type: "detectivo",
    severity: "medium",
    frequency: "diario"
  },
  denuncias: {
    title: "Relato de Irregularidade",
    description: "Relato recebido pelo canal externo de denúncias",
    severity: "high",
    anonymous: true,
    source: "canal-externo"
  }
};

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'wh_';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function InboundWebhooksManager() {
  const { empresaId } = useEmpresaId();
  const [webhooks, setWebhooks] = useState<InboundWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [payloadDialogOpen, setPayloadDialogOpen] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipoEvento, setTipoEvento] = useState('');
  const [moduloDestino, setModuloDestino] = useState('');
  const [saving, setSaving] = useState(false);

  const baseUrl = `https://lnlkahtugwmkznasapfd.supabase.co/functions/v1/api-inbound-webhook`;

  useEffect(() => {
    if (empresaId) fetchWebhooks();
  }, [empresaId]);

  const fetchWebhooks = async () => {
    if (!empresaId) return;
    try {
      const { data, error } = await supabase
        .from('api_inbound_webhooks')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setWebhooks((data || []) as InboundWebhook[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!empresaId || !nome.trim() || !tipoEvento || !moduloDestino) return;
    setSaving(true);
    try {
      const token = generateToken();
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase.from('api_inbound_webhooks').insert({
        empresa_id: empresaId,
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        webhook_token: token,
        tipo_evento: tipoEvento,
        modulo_destino: moduloDestino,
        created_by: userData.user?.id,
      });

      if (error) throw error;
      toast.success('Webhook criado', { description: 'Use a URL gerada para enviar eventos.' });
      setDialogOpen(false);
      setNome('');
      setDescricao('');
      setTipoEvento('');
      setModuloDestino('');
      fetchWebhooks();
    } catch (err: any) {
      toast.error('Erro ao criar webhook', { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, ativo: boolean) => {
    try {
      await supabase.from('api_inbound_webhooks').update({ ativo }).eq('id', id);
      fetchWebhooks();
      toast.success(ativo ? 'Webhook ativado' : 'Webhook desativado');
    } catch (err: any) {
      toast.error('Erro ao alterar status', { description: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('api_inbound_webhooks').delete().eq('id', id);
    setDeleteConfirm(null);
    fetchWebhooks();
    toast.success('Webhook removido');
  };

  const copyUrl = (token: string) => {
    navigator.clipboard.writeText(`${baseUrl}?token=${token}`);
    toast.info('URL copiada!');
  };

  const handleTestWebhook = async (wh: InboundWebhook) => {
    setTestingWebhook(wh.id);
    try {
      const payload = PAYLOAD_EXAMPLES[wh.modulo_destino] || { title: 'Evento de teste', description: 'Teste via Akuris' };
      
      const response = await fetch(`${baseUrl}?token=${wh.webhook_token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success('Teste enviado!', { description: `Evento de teste processado com sucesso no módulo ${wh.modulo_destino}.` });
        fetchWebhooks();
      } else {
        const err = await response.json();
        toast.error('Erro no teste', { description: err.error || 'Falha ao processar evento' });
      }
    } catch (err: any) {
      toast.error('Erro', { description: err.message });
    } finally {
      setTestingWebhook(null);
    }
  };

  const getPayloadForModule = (modulo: string) => {
    return JSON.stringify(PAYLOAD_EXAMPLES[modulo] || {}, null, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Webhooks de Entrada</h3>
          <p className="text-sm text-muted-foreground">
            Receba eventos de sistemas externos (SIEM, scanners, etc.) e crie registros automaticamente.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Webhook
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : webhooks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <Webhook className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum webhook de entrada configurado.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Configure webhooks para receber alertas de SIEM, scanners de vulnerabilidade e mais.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Recebidos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[140px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map(wh => (
                <TableRow key={wh.id}>
                  <TableCell className="font-medium">{wh.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {TIPOS_EVENTO.find(t => t.value === wh.tipo_evento)?.label || wh.tipo_evento}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {MODULOS_DESTINO.find(m => m.value === wh.modulo_destino)?.label || wh.modulo_destino}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <code className="text-[10px] bg-muted px-1 py-0.5 rounded max-w-[200px] truncate">
                        {baseUrl}?token={wh.webhook_token.substring(0, 8)}...
                      </code>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyUrl(wh.webhook_token)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{wh.total_recebidos?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Switch checked={wh.ativo} onCheckedChange={v => handleToggle(wh.id, v)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Ver payload de exemplo"
                        onClick={() => setPayloadDialogOpen(wh.modulo_destino)}
                      >
                        <Code className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Enviar evento de teste"
                        disabled={testingWebhook === wh.id || !wh.ativo}
                        onClick={() => handleTestWebhook(wh)}
                      >
                        {testingWebhook === wh.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirm(wh.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Webhook de Entrada</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Splunk SIEM Alerts" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição opcional..." rows={2} />
            </div>
            <div>
              <Label>Tipo de Evento</Label>
              <Select value={tipoEvento} onValueChange={setTipoEvento}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {TIPOS_EVENTO.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Módulo Destino</Label>
              <Select value={moduloDestino} onValueChange={setModuloDestino}>
                <SelectTrigger><SelectValue placeholder="Para onde enviar..." /></SelectTrigger>
                <SelectContent>
                  {MODULOS_DESTINO.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {moduloDestino && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Payload JSON esperado para {MODULOS_DESTINO.find(m => m.value === moduloDestino)?.label}</Label>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto font-mono">
                  {getPayloadForModule(moduloDestino)}
                </pre>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!nome.trim() || !tipoEvento || !moduloDestino || saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payload Example Dialog */}
      <Dialog open={!!payloadDialogOpen} onOpenChange={() => setPayloadDialogOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payload de Exemplo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-2">
            Envie um JSON com esta estrutura via POST para a URL do webhook:
          </p>
          <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto font-mono">
            {payloadDialogOpen ? getPayloadForModule(payloadDialogOpen) : ''}
          </pre>
          <p className="text-xs text-muted-foreground">
            Os campos <code className="bg-muted px-1 rounded">title</code>/<code className="bg-muted px-1 rounded">nome</code> e <code className="bg-muted px-1 rounded">description</code>/<code className="bg-muted px-1 rounded">descricao</code> são aceitos em inglês ou português.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(payloadDialogOpen ? getPayloadForModule(payloadDialogOpen) : '');
                toast.info('Payload copiado!');
              }}
            >
              <Copy className="h-4 w-4 mr-2" /> Copiar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
        title="Excluir Webhook"
        description="Qualquer sistema que envie dados para este webhook deixará de funcionar."
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
      />
    </div>
  );
}
