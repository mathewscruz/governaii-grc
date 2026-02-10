import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { Webhook, Plus, Copy, Trash2, Loader2 } from 'lucide-react';
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

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'wh_';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function InboundWebhooksManager() {
  const { toast } = useToast();
  const { empresaId } = useEmpresaId();
  const [webhooks, setWebhooks] = useState<InboundWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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
      toast({ title: 'Webhook criado', description: 'Use a URL gerada para enviar eventos.' });
      setDialogOpen(false);
      setNome('');
      setDescricao('');
      setTipoEvento('');
      setModuloDestino('');
      fetchWebhooks();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, ativo: boolean) => {
    await supabase.from('api_inbound_webhooks').update({ ativo }).eq('id', id);
    fetchWebhooks();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('api_inbound_webhooks').delete().eq('id', id);
    setDeleteConfirm(null);
    fetchWebhooks();
    toast({ title: 'Webhook removido' });
  };

  const copyUrl = (token: string) => {
    navigator.clipboard.writeText(`${baseUrl}?token=${token}`);
    toast({ title: 'URL copiada!' });
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
                <TableHead className="w-[80px]">Ações</TableHead>
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
                    <Badge variant="soft" className="text-xs">
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
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(wh.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
