import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  MessageSquare, 
  Video, 
  Cloud, 
  Webhook, 
  Zap, 
  FolderOpen,
  Settings,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Integration {
  id: string;
  tipo: string;
  nome: string;
  descricao: string;
  categoria: 'comunicacao' | 'armazenamento' | 'automacao' | 'itsm' | 'identidade';
  icon: React.ElementType;
  cor: string;
  disponivel: boolean;
  documentacaoUrl?: string;
}

interface IntegrationConfig {
  id: string;
  tipo_integracao: string;
  nome_exibicao: string;
  status: string;
  configuracoes: Record<string, unknown>;
  webhook_url: string | null;
  ultima_sincronizacao: string | null;
}

const INTEGRACOES_DISPONIVEIS: Integration[] = [
  // Comunicação
  {
    id: 'slack',
    tipo: 'slack',
    nome: 'Slack',
    descricao: 'Envie notificações para canais do Slack quando ocorrerem eventos importantes.',
    categoria: 'comunicacao',
    icon: MessageSquare,
    cor: '#4A154B',
    disponivel: true,
    documentacaoUrl: 'https://api.slack.com/messaging/webhooks'
  },
  {
    id: 'teams',
    tipo: 'teams',
    nome: 'Microsoft Teams',
    descricao: 'Integre com canais do Teams para alertas e notificações em tempo real.',
    categoria: 'comunicacao',
    icon: Video,
    cor: '#6264A7',
    disponivel: true,
    documentacaoUrl: 'https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook'
  },
  // Armazenamento
  {
    id: 'google_drive',
    tipo: 'google_drive',
    nome: 'Google Drive',
    descricao: 'Sincronize documentos aprovados automaticamente com o Google Drive.',
    categoria: 'armazenamento',
    icon: Cloud,
    cor: '#4285F4',
    disponivel: false,
    documentacaoUrl: 'https://developers.google.com/drive'
  },
  {
    id: 'onedrive',
    tipo: 'onedrive',
    nome: 'OneDrive / SharePoint',
    descricao: 'Integre com OneDrive e SharePoint para gerenciamento de documentos.',
    categoria: 'armazenamento',
    icon: FolderOpen,
    cor: '#0078D4',
    disponivel: false
  },
  // Automação
  {
    id: 'webhooks',
    tipo: 'webhooks',
    nome: 'Webhooks',
    descricao: 'Configure webhooks personalizados para integrar com qualquer sistema.',
    categoria: 'automacao',
    icon: Webhook,
    cor: '#10B981',
    disponivel: true
  },
  {
    id: 'zapier',
    tipo: 'zapier',
    nome: 'Zapier',
    descricao: 'Conecte com mais de 5.000 aplicativos através do Zapier.',
    categoria: 'automacao',
    icon: Zap,
    cor: '#FF4A00',
    disponivel: false,
    documentacaoUrl: 'https://zapier.com/developer'
  },
  // ITSM
  {
    id: 'jira',
    tipo: 'jira',
    nome: 'Jira Service Management',
    descricao: 'Crie tickets automaticamente a partir de incidentes e riscos.',
    categoria: 'itsm',
    icon: Settings,
    cor: '#0052CC',
    disponivel: false,
    documentacaoUrl: 'https://developer.atlassian.com/cloud/jira/platform/'
  }
];

const CATEGORIAS = {
  comunicacao: { nome: 'Comunicação', descricao: 'Notificações e alertas' },
  armazenamento: { nome: 'Armazenamento', descricao: 'Sincronização de documentos' },
  automacao: { nome: 'Automação', descricao: 'Workflows e webhooks' },
  itsm: { nome: 'ITSM & Ticketing', descricao: 'Gestão de serviços' },
  identidade: { nome: 'Identidade', descricao: 'SSO e provisionamento' }
};

export function IntegrationHub() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [configuredIntegrations, setConfiguredIntegrations] = useState<IntegrationConfig[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      // Buscar empresa_id do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('user_id', user?.id)
        .single();

      if (profile?.empresa_id) {
        setEmpresaId(profile.empresa_id);

        const { data, error } = await supabase
          .from('integracoes_config')
          .select('*')
          .eq('empresa_id', profile.empresa_id);

        if (error) throw error;
        setConfiguredIntegrations((data || []) as IntegrationConfig[]);
      }
    } catch (error) {
      console.error('Erro ao buscar integrações:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIntegrationStatus = (tipo: string): 'conectado' | 'desconectado' | 'erro' => {
    const config = configuredIntegrations.find(c => c.tipo_integracao === tipo);
    if (!config) return 'desconectado';
    return config.status as 'conectado' | 'desconectado' | 'erro';
  };

  const handleConfigureClick = (integration: Integration) => {
    if (!integration.disponivel) {
      toast.info('Em breve', {
        description: `A integração com ${integration.nome} estará disponível em breve.`
      });
      return;
    }
    
    setSelectedIntegration(integration);
    const existingConfig = configuredIntegrations.find(c => c.tipo_integracao === integration.tipo);
    setWebhookUrl(existingConfig?.webhook_url || '');
    setConfigDialogOpen(true);
  };

  const handleSaveIntegration = async () => {
    if (!selectedIntegration || !empresaId) return;

    setSaving(true);
    try {
      const existingConfig = configuredIntegrations.find(
        c => c.tipo_integracao === selectedIntegration.tipo
      );

      if (existingConfig) {
        // Atualizar
        const { error } = await supabase
          .from('integracoes_config')
          .update({
            webhook_url: webhookUrl || null,
            status: webhookUrl ? 'conectado' : 'desconectado',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id);

        if (error) throw error;
      } else {
        // Inserir novo
        const { error } = await supabase
          .from('integracoes_config')
          .insert({
            empresa_id: empresaId,
            tipo_integracao: selectedIntegration.tipo,
            nome_exibicao: selectedIntegration.nome,
            webhook_url: webhookUrl || null,
            status: webhookUrl ? 'conectado' : 'desconectado',
            created_by: user?.id
          });

        if (error) throw error;
      }

      toast.success('Integração salva', {
        description: `${selectedIntegration.nome} foi configurado com sucesso.`
      });

      setConfigDialogOpen(false);
      fetchIntegrations();
    } catch (error) {
      console.error('Erro ao salvar integração:', error);
      toast.error('Erro ao salvar', {
        description: 'Não foi possível salvar a configuração da integração.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!selectedIntegration) return;

    const existingConfig = configuredIntegrations.find(
      c => c.tipo_integracao === selectedIntegration.tipo
    );

    if (!existingConfig) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('integracoes_config')
        .delete()
        .eq('id', existingConfig.id);

      if (error) throw error;

      toast.success('Integração removida', {
        description: `${selectedIntegration.nome} foi desconectado.`
      });

      setConfigDialogOpen(false);
      setWebhookUrl('');
      fetchIntegrations();
    } catch (error) {
      console.error('Erro ao remover integração:', error);
      toast.error('Erro ao remover', {
        description: 'Não foi possível remover a integração.'
      });
    } finally {
      setSaving(false);
    }
  };

  const renderIntegrationCard = (integration: Integration) => {
    const status = getIntegrationStatus(integration.tipo);
    const Icon = integration.icon;

    return (
      <Card 
        key={integration.id} 
        className={`relative overflow-hidden transition-all hover:shadow-md ${
          !integration.disponivel ? 'opacity-60' : ''
        }`}
      >
        {!integration.disponivel && (
          <Badge 
            variant="secondary" 
            className="absolute top-3 right-3 text-xs"
          >
            Em breve
          </Badge>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div 
              className="p-2.5 rounded-lg" 
              style={{ backgroundColor: `${integration.cor}15` }}
            >
              <Icon 
                className="h-6 w-6" 
                style={{ color: integration.cor }} 
              />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base flex items-center gap-2">
                {integration.nome}
                {status === 'conectado' && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {status === 'erro' && (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-1 line-clamp-2">
                {integration.descricao}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <Badge 
              variant={status === 'conectado' ? 'default' : 'outline'}
              className={status === 'conectado' ? 'bg-green-500/10 text-green-600 border-green-200' : ''}
            >
              {status === 'conectado' ? 'Conectado' : 'Desconectado'}
            </Badge>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleConfigureClick(integration)}
            >
              {status === 'conectado' ? 'Configurar' : 'Conectar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Agrupar por categoria
  const integracoesPorCategoria = INTEGRACOES_DISPONIVEIS.reduce((acc, int) => {
    if (!acc[int.categoria]) {
      acc[int.categoria] = [];
    }
    acc[int.categoria].push(int);
    return acc;
  }, {} as Record<string, Integration[]>);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
        <Info className="h-5 w-5 text-primary" />
        <p className="text-sm text-muted-foreground">
          Conecte o GovernAII com suas ferramentas favoritas para automatizar processos e receber notificações em tempo real.
        </p>
      </div>

      {/* Categorias */}
      {Object.entries(integracoesPorCategoria).map(([categoria, integracoes]) => (
        <div key={categoria} className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{CATEGORIAS[categoria as keyof typeof CATEGORIAS]?.nome}</h3>
            <p className="text-sm text-muted-foreground">
              {CATEGORIAS[categoria as keyof typeof CATEGORIAS]?.descricao}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integracoes.map(renderIntegrationCard)}
          </div>
        </div>
      ))}

      {/* Dialog de Configuração */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedIntegration && (
                <>
                  <selectedIntegration.icon 
                    className="h-5 w-5" 
                    style={{ color: selectedIntegration.cor }} 
                  />
                  Configurar {selectedIntegration.nome}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedIntegration?.tipo === 'slack' && (
                'Configure um Incoming Webhook do Slack para receber notificações.'
              )}
              {selectedIntegration?.tipo === 'teams' && (
                'Configure um Incoming Webhook do Microsoft Teams.'
              )}
              {selectedIntegration?.tipo === 'webhooks' && (
                'Configure uma URL para receber webhooks de eventos do sistema.'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">
                {selectedIntegration?.tipo === 'webhooks' ? 'URL do Webhook' : 'URL do Incoming Webhook'}
              </Label>
              <Input
                id="webhook-url"
                placeholder="https://..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {selectedIntegration?.tipo === 'slack' && (
                  'Obtenha a URL em: Slack App > Incoming Webhooks > Add New Webhook'
                )}
                {selectedIntegration?.tipo === 'teams' && (
                  'Obtenha a URL em: Canal Teams > Conectores > Incoming Webhook'
                )}
                {selectedIntegration?.tipo === 'webhooks' && (
                  'Eventos serão enviados via POST com payload JSON'
                )}
              </p>
            </div>

            {selectedIntegration?.documentacaoUrl && (
              <a
                href={selectedIntegration.documentacaoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Ver documentação
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {getIntegrationStatus(selectedIntegration?.tipo || '') === 'conectado' && (
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={saving}
              >
                Desconectar
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button 
                variant="outline" 
                onClick={() => setConfigDialogOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveIntegration} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
