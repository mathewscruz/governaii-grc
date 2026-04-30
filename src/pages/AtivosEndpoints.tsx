import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, MonitorSmartphone, Wifi, WifiOff, ShieldAlert, KeyRound, MoreHorizontal, Eye, Ban, Copy, ArrowLeft, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import ConfirmDialog from '@/components/ConfirmDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { invokeEdgeFunction } from '@/lib/edge-function-utils';
import { logger } from '@/lib/logger';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EndpointAgent {
  id: string;
  hostname: string;
  so: string | null;
  so_versao: string | null;
  versao_agente: string | null;
  ip_publico: string | null;
  status: string;
  ultimo_checkin: string | null;
  postura_resumo: any;
  revogado: boolean;
  ativo_id: string | null;
}

const AtivosEndpoints: React.FC = () => {
  const { profile } = useAuth();
  const empresaId = profile?.empresa_id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenForm, setTokenForm] = useState({ descricao: '', validade_dias: '30', max_usos: '50' });
  const [detailAgent, setDetailAgent] = useState<EndpointAgent | null>(null);
  const [revokeAgent, setRevokeAgent] = useState<EndpointAgent | null>(null);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['endpoint-agents', empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('endpoint_agents')
        .select('*')
        .eq('empresa_id', empresaId!)
        .order('ultimo_checkin', { ascending: false });
      if (error) throw error;
      return data as EndpointAgent[];
    },
  });

  const { data: lastSnapshot } = useQuery({
    queryKey: ['endpoint-snapshot', detailAgent?.id],
    enabled: !!detailAgent,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('endpoint_inventory_snapshots')
        .select('payload, coletado_em')
        .eq('agent_id', detailAgent!.id)
        .eq('empresa_id', empresaId!)
        .order('coletado_em', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as { payload: any; coletado_em: string } | null;
    },
  });

  const stats = useMemo(() => {
    const total = agents.length;
    const online = agents.filter(a => a.status === 'online' && !a.revogado).length;
    const offline = agents.filter(a => a.status === 'offline' || a.revogado).length;
    const critica = agents.filter(a => {
      const p = a.postura_resumo || {};
      return p.bitlocker === false || p.antivirus === false || p.firewall === false || (p.pending_updates ?? 0) > 20;
    }).length;
    return { total, online, offline, critica };
  }, [agents]);

  const handleGenerateToken = async () => {
    if (!empresaId || !profile) return;
    try {
      const tokenBytes = new Uint8Array(24);
      crypto.getRandomValues(tokenBytes);
      const tokenStr = `AKE-${Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;

      const enc = new TextEncoder().encode(tokenStr);
      const hashBuf = await crypto.subtle.digest('SHA-256', enc);
      const tokenHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

      const expira = tokenForm.validade_dias === 'never'
        ? null
        : new Date(Date.now() + parseInt(tokenForm.validade_dias) * 86400_000).toISOString();

      const { error } = await supabase.from('endpoint_enrollment_tokens').insert({
        empresa_id: empresaId,
        token_hash: tokenHash,
        descricao: tokenForm.descricao || null,
        criado_por: profile.user_id,
        expira_em: expira,
        max_usos: tokenForm.max_usos ? parseInt(tokenForm.max_usos) : null,
      });
      if (error) throw error;

      setGeneratedToken(tokenStr);
      toast.success('Token de enrollment gerado');
    } catch (e: any) {
      logger.error('generate token', e);
      toast.error('Erro ao gerar token');
    }
  };

  const handleRevoke = async () => {
    if (!revokeAgent) return;
    const { error } = await invokeEdgeFunction('agent-revoke', {
      body: { target: 'agent', id: revokeAgent.id },
    });
    if (!error) {
      toast.success('Agente revogado');
      queryClient.invalidateQueries({ queryKey: ['endpoint-agents', empresaId] });
    }
    setRevokeAgent(null);
  };

  const closeTokenDialog = () => {
    setTokenDialogOpen(false);
    setGeneratedToken(null);
    setTokenForm({ descricao: '', validade_dias: '30', max_usos: '50' });
  };

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const AGENT_DOWNLOAD_URL = `${SUPABASE_URL}/storage/v1/object/public/endpoint-agent-binaries/akuris-agent.exe`;

  const installCommand = generatedToken
    ? `akuris-agent.exe install --token ${generatedToken} --server ${SUPABASE_URL}`
    : '';

  const downloadInstallerBat = () => {
    if (!generatedToken) return;
    const bat = [
      '@echo off',
      'setlocal',
      'net session >nul 2>&1',
      'if %errorlevel% NEQ 0 (',
      '  echo.',
      '  echo  ERRO: Execute este arquivo como Administrador',
      '  echo  ^(clique direito no arquivo .bat ^> "Executar como administrador"^)',
      '  echo.',
      '  pause',
      '  exit /b 1',
      ')',
      'echo Instalando Akuris Endpoint Agent...',
      'if not exist "C:\\Program Files\\Akuris" mkdir "C:\\Program Files\\Akuris"',
      'copy /Y "%~dp0akuris-agent.exe" "C:\\Program Files\\Akuris\\akuris-agent.exe" >nul',
      'if %errorlevel% NEQ 0 (',
      '  echo ERRO: nao encontrei akuris-agent.exe na mesma pasta deste instalador.',
      '  pause',
      '  exit /b 1',
      ')',
      `"C:\\Program Files\\Akuris\\akuris-agent.exe" install --token ${generatedToken} --server ${SUPABASE_URL}`,
      'if %errorlevel% NEQ 0 (',
      '  echo ERRO: falha ao registrar o agente. Verifique conexao com a internet.',
      '  pause',
      '  exit /b 1',
      ')',
      'echo.',
      'echo Akuris Agent instalado com sucesso. O servico ja esta rodando.',
      'echo.',
      'pause',
      '',
    ].join('\r\n');
    const blob = new Blob([bat], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'instalar-akuris.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Instalador .bat baixado');
  };

  const columns: Column<EndpointAgent>[] = [
    {
      key: 'hostname', label: 'Hostname',
      render: (_v, a) => (
        <div className="flex items-center gap-2">
          <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{a.hostname}</span>
        </div>
      ),
    },
    { key: 'so', label: 'SO', render: (_v, a) => `${a.so ?? '—'} ${a.so_versao ?? ''}` },
    {
      key: 'status', label: 'Status',
      render: (_v, a) => {
        if (a.revogado) return <Badge variant="destructive">Revogado</Badge>;
        if (a.status === 'online') return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30"><Wifi className="h-3 w-3 mr-1" />Online</Badge>;
        return <Badge variant="secondary"><WifiOff className="h-3 w-3 mr-1" />Offline</Badge>;
      },
    },
    {
      key: 'ultimo_checkin', label: 'Último check-in',
      render: (_v, a) => a.ultimo_checkin
        ? formatDistanceToNow(new Date(a.ultimo_checkin), { addSuffix: true, locale: ptBR })
        : '—',
    },
    {
      key: 'postura', label: 'Postura',
      render: (_v, a) => {
        const p = (a.postura_resumo || {}) as Record<string, any>;
        const items = [
          { label: 'BL', ok: p.bitlocker },
          { label: 'AV', ok: p.antivirus },
          { label: 'FW', ok: p.firewall },
        ];
        return (
          <div className="flex gap-1">
            {items.map((it) => (
              <Badge key={it.label} variant="outline"
                className={it.ok === true ? 'border-emerald-500/50 text-emerald-400'
                  : it.ok === false ? 'border-red-500/50 text-red-400' : 'opacity-50'}>
                {it.label}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: 'actions', label: '',
      render: (_v, a) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setDetailAgent(a)}>
              <Eye className="h-4 w-4 mr-2" /> Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRevokeAgent(a)} className="text-destructive">
              <Ban className="h-4 w-4 mr-2" /> Revogar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/ativos')} className="-ml-2">
        <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Ativos
      </Button>

      <PageHeader
        title="Endpoints"
        description="Inventário automático de computadores via agente Akuris"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href={AGENT_DOWNLOAD_URL} download>
                <Download className="h-4 w-4 mr-2" /> Baixar agente (.exe)
              </a>
            </Button>
            <Button onClick={() => setTokenDialogOpen(true)}>
              <KeyRound className="h-4 w-4 mr-2" /> Gerar token de instalação
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total" value={stats.total} icon={<MonitorSmartphone className="h-5 w-5" />} />
        <StatCard title="Online" value={stats.online} icon={<Wifi className="h-5 w-5" />} />
        <StatCard title="Offline" value={stats.offline} icon={<WifiOff className="h-5 w-5" />} />
        <StatCard title="Postura crítica" value={stats.critica} icon={<ShieldAlert className="h-5 w-5" />} />
      </div>

      <DataTable
        columns={columns}
        data={agents}
        loading={isLoading}
        emptyState={{
          icon: <MonitorSmartphone className="h-10 w-10" />,
          title: 'Nenhum endpoint cadastrado',
          description: 'Gere um token e instale o agente em uma máquina para começar.',
        }}
      />

      {/* Generate token dialog */}
      <Dialog open={tokenDialogOpen} onOpenChange={(o) => !o && closeTokenDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar token de enrollment</DialogTitle>
            <DialogDescription>
              Crie um token para instalar o agente Akuris em endpoints da sua empresa.
            </DialogDescription>
          </DialogHeader>

          {!generatedToken ? (
            <div className="space-y-4">
              <div>
                <Label>Descrição</Label>
                <Input value={tokenForm.descricao} onChange={(e) => setTokenForm({ ...tokenForm, descricao: e.target.value })} placeholder="Ex.: Lote TI - Set/2025" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Validade</Label>
                  <Select value={tokenForm.validade_dias} onValueChange={(v) => setTokenForm({ ...tokenForm, validade_dias: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="90">90 dias</SelectItem>
                      <SelectItem value="never">Sem expiração</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Máximo de usos</Label>
                  <Input type="number" value={tokenForm.max_usos} onChange={(e) => setTokenForm({ ...tokenForm, max_usos: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeTokenDialog}>Cancelar</Button>
                <Button onClick={handleGenerateToken}>Gerar token</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
                Copie o token agora — ele não será exibido novamente.
              </div>
              <div>
                <Label>Token</Label>
                <div className="flex gap-2">
                  <Input readOnly value={generatedToken} className="font-mono text-xs" />
                  <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(generatedToken); toast.success('Token copiado'); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label>Comando de instalação (Windows, executar como Admin)</Label>
                <div className="flex gap-2">
                  <Input readOnly value={installCommand} className="font-mono text-xs" />
                  <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(installCommand); toast.success('Comando copiado'); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                Passos: 1) Baixe o instalador. 2) Abra um PowerShell como Administrador. 3) Cole o comando acima.
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" asChild>
                  <a href={AGENT_DOWNLOAD_URL} download>
                    <Download className="h-4 w-4 mr-2" /> Baixar akuris-agent.exe
                  </a>
                </Button>
                <Button onClick={closeTokenDialog}>Concluído</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detailAgent} onOpenChange={(o) => !o && setDetailAgent(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{detailAgent?.hostname}</DialogTitle>
            <DialogDescription>
              {detailAgent?.so} {detailAgent?.so_versao} · agente v{detailAgent?.versao_agente ?? '—'}
            </DialogDescription>
          </DialogHeader>

          {detailAgent && (
            <Tabs defaultValue="hardware">
              <TabsList>
                <TabsTrigger value="hardware">Hardware</TabsTrigger>
                <TabsTrigger value="software">Software</TabsTrigger>
                <TabsTrigger value="security">Segurança</TabsTrigger>
                <TabsTrigger value="network">Rede</TabsTrigger>
              </TabsList>
              {(() => {
                const p = (lastSnapshot?.payload ?? {}) as Record<string, any>;
                return (
                  <ScrollArea className="h-[60vh] mt-4">
                    <TabsContent value="hardware" className="space-y-2 text-sm">
                      {p.hardware ? (
                        <pre className="text-xs bg-muted/30 p-3 rounded">{JSON.stringify(p.hardware, null, 2)}</pre>
                      ) : <p className="text-muted-foreground">Sem dados.</p>}
                    </TabsContent>
                    <TabsContent value="software" className="text-sm">
                      {Array.isArray(p.software) && p.software.length ? (
                        <ul className="space-y-1">
                          {p.software.map((s: any, i: number) => (
                            <li key={i} className="flex justify-between border-b border-border/40 py-1">
                              <span>{s.name}</span>
                              <span className="text-muted-foreground text-xs">{s.version ?? ''}</span>
                            </li>
                          ))}
                        </ul>
                      ) : <p className="text-muted-foreground">Sem dados.</p>}
                    </TabsContent>
                    <TabsContent value="security">
                      <pre className="text-xs bg-muted/30 p-3 rounded">{JSON.stringify(p.security ?? {}, null, 2)}</pre>
                    </TabsContent>
                    <TabsContent value="network">
                      <pre className="text-xs bg-muted/30 p-3 rounded">
                        {JSON.stringify({
                          ip_publico: detailAgent.ip_publico,
                          mac: p.mac_addresses,
                          ips: p.ip_addresses,
                          ports: p.open_ports,
                        }, null, 2)}
                      </pre>
                    </TabsContent>
                  </ScrollArea>
                );
              })()}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!revokeAgent}
        onOpenChange={(o) => !o && setRevokeAgent(null)}
        title="Revogar agente?"
        description={`O agente ${revokeAgent?.hostname} deixará de enviar dados. Esta ação não pode ser desfeita.`}
        confirmText="Revogar"
        onConfirm={handleRevoke}
        variant="destructive"
      />
    </div>
  );
};

export default AtivosEndpoints;
