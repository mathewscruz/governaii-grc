import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Webhook, 
  Zap, 
  FolderOpen,
  Settings,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
  Cloud
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { SlackConfigDialog } from './integrations/SlackConfigDialog';
import { TeamsConfigDialog } from './integrations/TeamsConfigDialog';
import { WebhooksConfigDialog } from './integrations/WebhooksConfigDialog';
import { JiraConfigDialog } from './integrations/JiraConfigDialog';
import { AzureConfigDialog } from './integrations/AzureConfigDialog';

interface Integration {
  id: string;
  tipo: string;
  nome: string;
  descricao: string;
  categoria: 'comunicacao' | 'armazenamento' | 'automacao' | 'itsm' | 'identidade';
  logoUrl?: string;
  icon?: React.ElementType;
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
  {
    id: 'slack',
    tipo: 'slack',
    nome: 'Slack',
    descricao: 'Envie notificações para canais do Slack quando ocorrerem eventos importantes.',
    categoria: 'comunicacao',
    logoUrl: 'https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg',
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
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg',
    cor: '#6264A7',
    disponivel: true,
    documentacaoUrl: 'https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook'
  },
  {
    id: 'google_drive',
    tipo: 'google_drive',
    nome: 'Google Drive',
    descricao: 'Sincronize documentos aprovados automaticamente com o Google Drive.',
    categoria: 'armazenamento',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg',
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
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Microsoft_Office_OneDrive_%282019%E2%80%93present%29.svg',
    icon: FolderOpen,
    cor: '#0078D4',
    disponivel: false
  },
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
    logoUrl: 'https://cdn.worldvectorlogo.com/logos/zapier.svg',
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
    logoUrl: 'https://cdn.worldvectorlogo.com/logos/jira-1.svg',
    icon: Settings,
    cor: '#0052CC',
    disponivel: true,
    documentacaoUrl: 'https://developer.atlassian.com/cloud/jira/platform/'
  },
  // Identidade
  {
    id: 'azure',
    tipo: 'azure',
    nome: 'Microsoft Azure / Intune',
    descricao: 'Sincronize dispositivos do Intune e Azure AD com o módulo de Ativos.',
    categoria: 'identidade',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Microsoft_Azure.svg',
    icon: Cloud,
    cor: '#0078D4',
    disponivel: true,
    documentacaoUrl: 'https://learn.microsoft.com/en-us/graph/api/resources/intune-devices-manageddevice'
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
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  
  // Dialog states
  const [slackDialogOpen, setSlackDialogOpen] = useState(false);
  const [teamsDialogOpen, setTeamsDialogOpen] = useState(false);
  const [webhooksDialogOpen, setWebhooksDialogOpen] = useState(false);
  const [jiraDialogOpen, setJiraDialogOpen] = useState(false);
  const [azureDialogOpen, setAzureDialogOpen] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
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

  const getExistingConfig = (tipo: string) => {
    return configuredIntegrations.find(c => c.tipo_integracao === tipo);
  };

  const handleConfigureClick = (integration: Integration) => {
    if (!integration.disponivel) {
      toast.info('Em breve', {
        description: `A integração com ${integration.nome} estará disponível em breve.`
      });
      return;
    }

    switch (integration.tipo) {
      case 'slack':
        setSlackDialogOpen(true);
        break;
      case 'teams':
        setTeamsDialogOpen(true);
        break;
      case 'webhooks':
        setWebhooksDialogOpen(true);
        break;
      case 'jira':
        setJiraDialogOpen(true);
        break;
      case 'azure':
        setAzureDialogOpen(true);
        break;
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
          <Badge variant="secondary" className="absolute top-3 right-3 text-xs">
            Em breve
          </Badge>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div 
              className="p-2.5 rounded-lg flex items-center justify-center" 
              style={{ backgroundColor: `${integration.cor}15` }}
            >
              {integration.logoUrl ? (
                <img 
                  src={integration.logoUrl} 
                  alt={integration.nome}
                  className="h-6 w-6 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : Icon ? (
                <Icon className="h-6 w-6" style={{ color: integration.cor }} />
              ) : null}
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

  const integracoesPorCategoria = INTEGRACOES_DISPONIVEIS.reduce((acc, int) => {
    if (!acc[int.categoria]) acc[int.categoria] = [];
    acc[int.categoria].push(int);
    return acc;
  }, {} as Record<string, Integration[]>);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
        <Info className="h-5 w-5 text-primary" />
        <p className="text-sm text-muted-foreground">
          Conecte o GovernAII com suas ferramentas favoritas para automatizar processos e receber notificações em tempo real.
        </p>
      </div>

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

      {empresaId && (
        <>
          <SlackConfigDialog
            open={slackDialogOpen}
            onOpenChange={setSlackDialogOpen}
            empresaId={empresaId}
            existingConfig={getExistingConfig('slack') as any}
            onSaved={fetchIntegrations}
          />
          <TeamsConfigDialog
            open={teamsDialogOpen}
            onOpenChange={setTeamsDialogOpen}
            empresaId={empresaId}
            existingConfig={getExistingConfig('teams') as any}
            onSaved={fetchIntegrations}
          />
          <WebhooksConfigDialog
            open={webhooksDialogOpen}
            onOpenChange={setWebhooksDialogOpen}
            empresaId={empresaId}
            existingConfig={getExistingConfig('webhooks') as any}
            onSaved={fetchIntegrations}
          />
          <JiraConfigDialog
            open={jiraDialogOpen}
            onOpenChange={setJiraDialogOpen}
            empresaId={empresaId}
            existingConfig={getExistingConfig('jira') as any}
            onSaved={fetchIntegrations}
          />
          <AzureConfigDialog
            open={azureDialogOpen}
            onOpenChange={setAzureDialogOpen}
            empresaId={empresaId}
            existingConfig={getExistingConfig('azure') as any}
            onSaved={fetchIntegrations}
          />
        </>
      )}
    </div>
  );
}
