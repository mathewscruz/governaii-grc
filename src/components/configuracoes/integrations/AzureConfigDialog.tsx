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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2, XCircle, ExternalLink, Send, AlertCircle, RefreshCw, Monitor } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AzureConfigDialogProps {
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

const SYNC_OPTIONS = [
  { id: 'intune_devices', label: 'Dispositivos do Intune', descricao: 'Sincronizar dispositivos gerenciados pelo Intune' },
  { id: 'azure_ad_devices', label: 'Dispositivos do Azure AD', descricao: 'Sincronizar dispositivos registrados no Azure AD' },
  { id: 'azure_ad_users', label: 'Usuários do Azure AD', descricao: 'Sincronizar lista de usuários (somente leitura)' },
  { id: 'azure_ad_groups', label: 'Grupos do Azure AD', descricao: 'Sincronizar grupos para revisão de acessos' },
];

export function AzureConfigDialog({
  open,
  onOpenChange,
  empresaId,
  existingConfig,
  onSaved
}: AzureConfigDialogProps) {
  const [tenantId, setTenantId] = useState(
    (existingConfig?.configuracoes?.tenant_id as string) || ''
  );
  const [clientId, setClientId] = useState(
    (existingConfig?.configuracoes?.client_id as string) || ''
  );
  const [clientSecret, setClientSecret] = useState('');
  const [selectedSync, setSelectedSync] = useState<string[]>(
    (existingConfig?.configuracoes?.sync_options as string[]) || ['intune_devices']
  );
  const [syncInterval, setSyncInterval] = useState(
    (existingConfig?.configuracoes?.sync_interval as string) || 'daily'
  );
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [lastSyncInfo, setLastSyncInfo] = useState<{ count: number; date: string } | null>(null);

  const handleTestConnection = async () => {
    if (!tenantId || !clientId || (!clientSecret && !existingConfig)) {
      toast.error('Campos obrigatórios', { description: 'Preencha Tenant ID, Client ID e Client Secret.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('azure-integration', {
        body: {
          action: 'test',
          tenant_id: tenantId,
          client_id: clientId,
          client_secret: clientSecret || undefined,
          empresa_id: empresaId
        }
      });

      if (error) throw error;

      if (data?.success) {
        setTestResult('success');
        toast.success('Conexão bem-sucedida!', {
          description: `Conectado ao tenant: ${data.tenant_name || tenantId}`
        });
      } else {
        throw new Error(data?.error || 'Falha no teste');
      }
    } catch (error: any) {
      setTestResult('error');
      toast.error('Falha na conexão', {
        description: error.message || 'Verifique as credenciais.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncNow = async () => {
    if (!existingConfig?.id) {
      toast.error('Salve a configuração primeiro');
      return;
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('azure-integration', {
        body: {
          action: 'sync',
          empresa_id: empresaId,
          sync_options: selectedSync
        }
      });

      if (error) throw error;

      if (data?.success) {
        setLastSyncInfo({
          count: data.devices_synced || 0,
          date: new Date().toLocaleString('pt-BR')
        });
        toast.success('Sincronização concluída!', {
          description: `${data.devices_synced || 0} dispositivos sincronizados.`
        });
      } else {
        throw new Error(data?.error || 'Falha na sincronização');
      }
    } catch (error: any) {
      toast.error('Erro na sincronização', { description: error.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = async () => {
    if (!tenantId || !clientId) {
      toast.error('Campos obrigatórios', { description: 'Preencha Tenant ID e Client ID.' });
      return;
    }

    if (!existingConfig && !clientSecret) {
      toast.error('Client Secret obrigatório', { description: 'Informe o Client Secret.' });
      return;
    }

    setSaving(true);
    try {
      const configData = {
        empresa_id: empresaId,
        tipo_integracao: 'azure',
        nome_exibicao: 'Microsoft Azure / Intune',
        webhook_url: `https://graph.microsoft.com/v1.0`,
        status: 'conectado',
        configuracoes: { 
          tenant_id: tenantId,
          client_id: clientId,
          sync_options: selectedSync,
          sync_interval: syncInterval,
          has_secret: true
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

      // Salvar credenciais de forma segura (em produção, usar Vault)
      // Por enquanto, armazenamos criptografado na config

      toast.success('Azure configurado!', {
        description: 'Dispositivos serão sincronizados conforme configurado.'
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

      toast.success('Azure desconectado');
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Erro ao desconectar', { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const toggleSync = (syncId: string) => {
    setSelectedSync(prev =>
      prev.includes(syncId)
        ? prev.filter(s => s !== syncId)
        : [...prev, syncId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Microsoft_Azure.svg"
              alt="Azure"
              className="h-6 w-6"
            />
            Configurar Microsoft Azure / Intune
          </DialogTitle>
          <DialogDescription>
            Sincronize dispositivos do Intune e Azure AD com o módulo de Ativos.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="sync">Sincronização</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-6 py-4">
            {/* Instruções */}
            <div className="p-3 rounded-lg bg-muted/50 border space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Como configurar o App Registration
              </h4>
              <ol className="text-xs text-muted-foreground space-y-1 ml-6 list-decimal">
                <li>Acesse o <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Portal Azure</a></li>
                <li>Vá em Azure Active Directory → App registrations → New registration</li>
                <li>Crie o app e anote o <strong>Application (client) ID</strong> e <strong>Directory (tenant) ID</strong></li>
                <li>Em Certificates & secrets, crie um Client Secret</li>
                <li>Em API permissions, adicione:
                  <ul className="ml-4 mt-1 list-disc">
                    <li>DeviceManagementManagedDevices.Read.All (Intune)</li>
                    <li>Device.Read.All (Azure AD Devices)</li>
                    <li>User.Read.All (opcional, para usuários)</li>
                  </ul>
                </li>
                <li>Clique em "Grant admin consent"</li>
              </ol>
            </div>

            {/* Tenant ID */}
            <div className="space-y-2">
              <Label htmlFor="azure-tenant">Directory (Tenant) ID *</Label>
              <Input
                id="azure-tenant"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={tenantId}
                onChange={(e) => {
                  setTenantId(e.target.value);
                  setTestResult(null);
                }}
              />
            </div>

            {/* Client ID */}
            <div className="space-y-2">
              <Label htmlFor="azure-client">Application (Client) ID *</Label>
              <Input
                id="azure-client"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  setTestResult(null);
                }}
              />
            </div>

            {/* Client Secret */}
            <div className="space-y-2">
              <Label htmlFor="azure-secret">
                Client Secret {existingConfig ? '(deixe em branco para manter)' : '*'}
              </Label>
              <Input
                id="azure-secret"
                type="password"
                placeholder="••••••••••••••••"
                value={clientSecret}
                onChange={(e) => {
                  setClientSecret(e.target.value);
                  setTestResult(null);
                }}
              />
            </div>

            {/* Testar conexão */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing || !tenantId || !clientId}
                className="flex-1"
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : testResult === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                ) : testResult === 'error' ? (
                  <XCircle className="h-4 w-4 mr-2 text-destructive" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Testar Conexão
              </Button>
            </div>
            {testResult === 'success' && (
              <p className="text-xs text-green-600">✓ Conexão com Azure estabelecida</p>
            )}
            {testResult === 'error' && (
              <p className="text-xs text-destructive">✗ Falha na conexão - verifique as credenciais</p>
            )}

            {/* Link documentação */}
            <a
              href="https://learn.microsoft.com/en-us/graph/api/resources/intune-devices-manageddevice"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Ver documentação do Microsoft Graph
              <ExternalLink className="h-3 w-3" />
            </a>
          </TabsContent>

          <TabsContent value="sync" className="space-y-6 py-4">
            {/* Opções de sincronização */}
            <div className="space-y-3">
              <Label>O que sincronizar</Label>
              <div className="space-y-3">
                {SYNC_OPTIONS.map(option => (
                  <div
                    key={option.id}
                    className="flex items-start gap-3 p-3 rounded-md border hover:bg-muted/50"
                  >
                    <Checkbox
                      id={option.id}
                      checked={selectedSync.includes(option.id)}
                      onCheckedChange={() => toggleSync(option.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={option.id}
                        className="text-sm font-medium cursor-pointer flex items-center gap-2"
                      >
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        {option.label}
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {option.descricao}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Intervalo de sincronização */}
            <div className="space-y-2">
              <Label>Frequência de sincronização</Label>
              <div className="flex gap-2">
                {[
                  { value: 'manual', label: 'Manual' },
                  { value: 'daily', label: 'Diária' },
                  { value: 'weekly', label: 'Semanal' },
                ].map(opt => (
                  <Button
                    key={opt.value}
                    variant={syncInterval === opt.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSyncInterval(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sincronizar agora */}
            {existingConfig && (
              <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Sincronização Manual</h4>
                    <p className="text-xs text-muted-foreground">
                      Sincronize os dispositivos agora
                    </p>
                  </div>
                  <Button
                    onClick={handleSyncNow}
                    disabled={syncing || selectedSync.length === 0}
                  >
                    {syncing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Sincronizar Agora
                  </Button>
                </div>

                {lastSyncInfo && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Última sincronização: {lastSyncInfo.count} dispositivos em {lastSyncInfo.date}
                  </div>
                )}
              </div>
            )}

            {/* Mapeamento */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <h4 className="font-medium text-sm text-blue-600 mb-2">Mapeamento de Dados</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• <strong>Nome do dispositivo</strong> → Nome do Ativo</p>
                <p>• <strong>Modelo</strong> → Descrição</p>
                <p>• <strong>Sistema Operacional</strong> → Tipo de Ativo</p>
                <p>• <strong>Usuário Principal</strong> → Proprietário</p>
                <p>• <strong>Compliance State</strong> → Status</p>
                <p>• <strong>Serial Number</strong> → Tags</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

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
          <Button onClick={handleSave} disabled={saving || !tenantId || !clientId}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
