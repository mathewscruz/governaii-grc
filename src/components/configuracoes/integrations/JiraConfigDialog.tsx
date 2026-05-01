import { useState } from 'react';
import { DialogShell } from '@/components/ui/dialog-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, ExternalLink, Send, AlertCircle, Ticket } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { AkurisPulse } from '@/components/ui/AkurisPulse';
interface JiraConfigDialogProps {
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

export function JiraConfigDialog({
  open,
  onOpenChange,
  empresaId,
  existingConfig,
  onSaved
}: JiraConfigDialogProps) {
  const [instanceUrl, setInstanceUrl] = useState(
    (existingConfig?.configuracoes?.instance_url as string) || ''
  );
  const [email, setEmail] = useState(
    (existingConfig?.configuracoes?.email as string) || ''
  );
  const [apiToken, setApiToken] = useState('');
  const [projectKey, setProjectKey] = useState(
    (existingConfig?.configuracoes?.project_key as string) || ''
  );
  const [issueType, setIssueType] = useState(
    (existingConfig?.configuracoes?.issue_type as string) || 'Task'
  );
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const handleTestConnection = async () => {
    if (!instanceUrl || !email || !apiToken) {
      toast.error('Campos obrigatórios', { description: 'Preencha URL, email e API Token.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-integration-connection', {
        body: {
          tipo: 'jira',
          instance_url: instanceUrl,
          email,
          api_token: apiToken,
          project_key: projectKey
        }
      });

      if (error) throw error;

      if (data?.success) {
        setTestResult('success');
        toast.success('Conexão bem-sucedida!', {
          description: 'Credenciais do Jira validadas.'
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

  const handleSave = async () => {
    if (!instanceUrl || !email || !projectKey) {
      toast.error('Campos obrigatórios', { description: 'Preencha todos os campos.' });
      return;
    }

    // Se não tem config existente, precisa do token
    if (!existingConfig && !apiToken) {
      toast.error('API Token obrigatório', { description: 'Informe o API Token do Jira.' });
      return;
    }

    setSaving(true);
    try {
      const configData = {
        empresa_id: empresaId,
        tipo_integracao: 'jira' as const,
        nome_exibicao: 'Jira Service Management',
        webhook_url: instanceUrl,
        status: 'conectado',
        configuracoes: { 
          instance_url: instanceUrl,
          email,
          project_key: projectKey,
          issue_type: issueType,
          has_token: true
        },
        ...(apiToken ? { credenciais_encrypted: JSON.stringify({ api_token: apiToken }) } : {}),
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

      toast.success('Jira configurado!', {
        description: 'Incidentes serão sincronizados automaticamente.'
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

      toast.success('Jira desconectado');
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Erro ao desconectar', { description: error.message });
    } finally {
      setSaving(false);
    }
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
        <Button size="sm" onClick={handleSave} disabled={saving || !instanceUrl || !email || !projectKey}>
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
      title="Configurar Jira Service Management"
      description="Crie tickets no Jira automaticamente a partir de incidentes e riscos."
      icon={Ticket}
      size="md"
      footer={footer}
      onSubmit={handleSave}
      isDirty={!!(instanceUrl || email || apiToken || projectKey)}
    >
      <div className="space-y-6">
          {/* Informação sobre o que a integração faz */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2 text-primary">
              <AlertCircle className="h-4 w-4" />
              Como funciona
            </h4>
            <p className="text-xs text-muted-foreground">
              Quando incidentes críticos, riscos ou denúncias forem criados no Akuris, um ticket será automaticamente criado no projeto Jira configurado com todos os detalhes e link direto.
            </p>
          </div>

          {/* URL da instância */}
          <div className="space-y-2">
            <Label htmlFor="jira-url">URL da Instância Jira *</Label>
            <Input
              id="jira-url"
              placeholder="https://sua-empresa.atlassian.net"
              value={instanceUrl}
              onChange={(e) => {
                setInstanceUrl(e.target.value);
                setTestResult(null);
              }}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="jira-email">Email da Conta Atlassian *</Label>
            <Input
              id="jira-email"
              type="email"
              placeholder="seu-email@empresa.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setTestResult(null);
              }}
            />
          </div>

          {/* API Token */}
          <div className="space-y-2">
            <Label htmlFor="jira-token">
              API Token {existingConfig ? '(deixe em branco para manter)' : '*'}
            </Label>
            <Input
              id="jira-token"
              type="password"
              placeholder="••••••••••••••••"
              value={apiToken}
              onChange={(e) => {
                setApiToken(e.target.value);
                setTestResult(null);
              }}
            />
            <a
              href="https://id.atlassian.com/manage-profile/security/api-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Criar API Token
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Project Key */}
          <div className="space-y-2">
            <Label htmlFor="jira-project">Chave do Projeto *</Label>
            <Input
              id="jira-project"
              placeholder="PROJ"
              value={projectKey}
              onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
            />
            <p className="text-xs text-muted-foreground">
              A chave do projeto onde os tickets serão criados (ex: GRC, RISK)
            </p>
          </div>

          {/* Issue Type */}
          <div className="space-y-2">
            <Label>Tipo de Issue</Label>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Task">Task</SelectItem>
                <SelectItem value="Bug">Bug</SelectItem>
                <SelectItem value="Story">Story</SelectItem>
                <SelectItem value="Incident">Incident</SelectItem>
                <SelectItem value="Service Request">Service Request</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Testar conexão */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || !instanceUrl || !email || !apiToken}
              className="flex-1"
            >
              {testing ? (
                <AkurisPulse size={16} className="mr-2" />
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
            <p className="text-xs text-green-600">✓ Conexão verificada com sucesso</p>
          )}
          {testResult === 'error' && (
            <p className="text-xs text-destructive">✗ Falha na conexão - verifique as credenciais</p>
          )}
      </div>
    </DialogShell>
  );
}
