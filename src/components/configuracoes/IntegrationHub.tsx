import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plug, 
  CheckCircle2, 
  XCircle, 
  Info,
  Loader2,
  History,
  Key,
  Webhook
} from 'lucide-react';
import { SlackConfigDialog } from './integrations/SlackConfigDialog';
import { TeamsConfigDialog } from './integrations/TeamsConfigDialog';
import { WebhooksConfigDialog } from './integrations/WebhooksConfigDialog';
import { JiraConfigDialog } from './integrations/JiraConfigDialog';
import { AzureConfigDialog } from './integrations/AzureConfigDialog';
import { IntegrationLogViewer } from './integrations/IntegrationLogViewer';
import { ApiKeysManager } from './ApiKeysManager';
import { InboundWebhooksManager } from './InboundWebhooksManager';

// Logos inline SVG
const SlackLogo = () => (
  <svg viewBox="0 0 127 127" className="w-8 h-8">
    <path d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z" fill="#E01E5A"/>
    <path d="M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H14c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33z" fill="#36C5F0"/>
    <path d="M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V14c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v32.9z" fill="#2EB67D"/>
    <path d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2h-33z" fill="#ECB22E"/>
  </svg>
);

const TeamsLogo = () => (
  <svg viewBox="0 0 48 48" className="w-8 h-8">
    <path fill="#5059C9" d="M44 22v10c0 2.2-1.8 4-4 4h-4V18h4C42.2 18 44 19.8 44 22z"/>
    <circle fill="#5059C9" cx="36" cy="12" r="4"/>
    <circle fill="#7B83EB" cx="28" cy="10" r="6"/>
    <path fill="#7B83EB" d="M36 18H20c-2.2 0-4 1.8-4 4v14c0 5.5 4.5 10 10 10s10-4.5 10-10V22C36 19.8 34.2 18 32 18z"/>
  </svg>
);

const OneDriveLogo = () => (
  <svg viewBox="0 0 48 48" className="w-8 h-8">
    <path fill="#1565C0" d="M26 33c-6.1 0-11-4.9-11-11 0-5.5 4.1-10.1 9.4-10.9C26.2 7.8 29.9 5 34.2 5 39.5 5 44 9.5 44 15c0 1-.2 2-.5 3h.5c2.2 0 4 1.8 4 4v7c0 2.2-1.8 4-4 4H26z"/>
    <path fill="#42A5F5" d="M14 39c-4.4 0-8-3.6-8-8 0-3.6 2.4-6.7 5.7-7.7C12.5 21.5 14.5 20 17 20c3.3 0 6 2.7 6 6 0 .3 0 .7-.1 1h.1c2.8 0 5 2.2 5 5v3c0 2.2-1.8 4-4 4H14z"/>
  </svg>
);

const GoogleDriveLogo = () => (
  <svg viewBox="0 0 87.3 78" className="w-8 h-8">
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
  </svg>
);

const ZapierLogo = () => (
  <svg viewBox="0 0 200 200" className="w-8 h-8">
    <path fill="#FF4A00" d="M134.9 100l-16.6-16.6c-4.3-4.3-4.3-11.3 0-15.6l32.1-32.1c4.3-4.3 4.3-11.3 0-15.6l-6.4-6.4c-4.3-4.3-11.3-4.3-15.6 0L96.3 45.8c-4.3 4.3-11.3 4.3-15.6 0L48.6 13.7c-4.3-4.3-11.3-4.3-15.6 0l-6.4 6.4c-4.3 4.3-4.3 11.3 0 15.6l32.1 32.1c4.3 4.3 4.3 11.3 0 15.6L42.1 100l16.6 16.6c4.3 4.3 4.3 11.3 0 15.6l-32.1 32.1c-4.3 4.3-4.3 11.3 0 15.6l6.4 6.4c4.3 4.3 11.3 4.3 15.6 0l32.1-32.1c4.3-4.3 11.3-4.3 15.6 0l32.1 32.1c4.3 4.3 11.3 4.3 15.6 0l6.4-6.4c4.3-4.3 4.3-11.3 0-15.6l-32.1-32.1c-4.3-4.3-4.3-11.3 0-15.6L134.9 100z"/>
    <circle fill="#FF4A00" cx="100" cy="100" r="22"/>
  </svg>
);

const JiraLogo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8">
    <defs>
      <linearGradient id="jira-a" x1="99%" y1="26%" x2="24%" y2="99%">
        <stop offset="18%" stopColor="#0052cc"/>
        <stop offset="100%" stopColor="#2684ff"/>
      </linearGradient>
      <linearGradient id="jira-b" x1="12%" y1="80%" x2="79%" y2="20%">
        <stop offset="18%" stopColor="#0052cc"/>
        <stop offset="100%" stopColor="#2684ff"/>
      </linearGradient>
    </defs>
    <path fill="url(#jira-a)" d="M15.52 1.09L1.09 15.52a.75.75 0 000 1.06l14.43 14.43a.75.75 0 001.06 0l7.22-7.22L16.03 16l7.77-7.79-7.22-7.22a.75.75 0 00-1.06.1z"/>
    <path fill="url(#jira-b)" d="M15.52 9.44L9.06 16l6.46 6.56 6.97-6.97a.84.84 0 000-1.18z"/>
  </svg>
);

const AzureLogo = () => (
  <svg viewBox="0 0 96 96" className="w-8 h-8">
    <defs>
      <linearGradient id="azure-a" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#114a8b"/>
        <stop offset="100%" stopColor="#0669bc"/>
      </linearGradient>
      <linearGradient id="azure-c" x1="40%" y1="0%" x2="57%" y2="100%">
        <stop offset="0%" stopColor="#3ccbf4"/>
        <stop offset="100%" stopColor="#2892df"/>
      </linearGradient>
    </defs>
    <path fill="url(#azure-a)" d="M33.34 6.54H56.8L32.54 88.55a3.58 3.58 0 01-3.4 2.45H7.9a3.58 3.58 0 01-3.39-4.71L28 9a3.58 3.58 0 013.34-2.46z"/>
    <path fill="url(#azure-c)" d="M33.34 6.54a3.54 3.54 0 00-3.38 2.51L6.51 86.32a3.58 3.58 0 003.39 4.68h22.62a3.73 3.73 0 002.87-2.39l5.06-14.89 17.76 16.6a3.64 3.64 0 002.3.68h24.44l-10.7-30.74-36.08.02L56.8 6.54z"/>
  </svg>
);

const WebhookIcon = () => (
  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
    <Plug className="w-5 h-5 text-white" />
  </div>
);

interface Integration {
  id: string;
  tipo: string;
  nome: string;
  descricao: string;
  categoria: string;
  disponivel: boolean;
  betaLabel?: string;
  cor: string;
  Logo: React.FC;
}

interface IntegrationConfig {
  id: string;
  tipo_integracao: string;
  status: string;
  configuracoes: any;
  ultima_sincronizacao?: string;
}

const INTEGRACOES_DISPONIVEIS: Integration[] = [
  {
    id: 'slack',
    tipo: 'slack',
    nome: 'Slack',
    descricao: 'Quando incidentes, riscos ou controles são criados/alterados, uma mensagem formatada é enviada ao canal Slack configurado com detalhes e link direto.',
    categoria: 'comunicacao',
    disponivel: true,
    betaLabel: 'Webhook',
    cor: '#4A154B',
    Logo: SlackLogo
  },
  {
    id: 'teams',
    tipo: 'teams',
    nome: 'Microsoft Teams',
    descricao: 'Notificações automáticas em formato de card no canal do Teams quando eventos de segurança, compliance ou riscos ocorrem no Akuris.',
    categoria: 'comunicacao',
    disponivel: true,
    betaLabel: 'Webhook',
    cor: '#5059C9',
    Logo: TeamsLogo
  },
  {
    id: 'webhooks',
    tipo: 'webhooks',
    nome: 'Webhooks',
    descricao: 'Envie payloads JSON para qualquer URL quando eventos ocorrerem. Ideal para integrar com sistemas internos, SIEMs ou plataformas de automação.',
    categoria: 'automacao',
    disponivel: true,
    cor: '#7C3AED',
    Logo: WebhookIcon
  },
  {
    id: 'jira',
    tipo: 'jira',
    nome: 'Jira',
    descricao: 'Cria tickets automaticamente no Jira quando incidentes críticos, riscos ou denúncias são registrados, com detalhes e link direto ao Akuris.',
    categoria: 'itsm',
    disponivel: true,
    cor: '#0052CC',
    Logo: JiraLogo
  },
  {
    id: 'azure',
    tipo: 'azure',
    nome: 'Azure / Intune',
    descricao: 'Sincroniza dispositivos gerenciados do Microsoft Intune com o módulo de Ativos, incluindo status de compliance e dados do dispositivo.',
    categoria: 'cloud',
    disponivel: true,
    cor: '#0078D4',
    Logo: AzureLogo
  },
  {
    id: 'onedrive',
    tipo: 'onedrive',
    nome: 'OneDrive',
    descricao: 'Sincronize documentos aprovados com o OneDrive/SharePoint.',
    categoria: 'armazenamento',
    disponivel: false,
    cor: '#0078D4',
    Logo: OneDriveLogo
  },
  {
    id: 'google-drive',
    tipo: 'google-drive',
    nome: 'Google Drive',
    descricao: 'Backup automático de documentos e evidências no Google Drive.',
    categoria: 'armazenamento',
    disponivel: false,
    cor: '#4285F4',
    Logo: GoogleDriveLogo
  },
  {
    id: 'zapier',
    tipo: 'zapier',
    nome: 'Zapier',
    descricao: 'Conecte com milhares de apps via Zapier.',
    categoria: 'automacao',
    disponivel: false,
    cor: '#FF4A00',
    Logo: ZapierLogo
  }
];

const CATEGORIAS = {
  comunicacao: { nome: 'Comunicação', descricao: 'Ferramentas de comunicação e colaboração' },
  automacao: { nome: 'Automação', descricao: 'Plataformas de automação e webhooks' },
  itsm: { nome: 'ITSM / Gestão de TI', descricao: 'Ferramentas de gestão de serviços' },
  cloud: { nome: 'Cloud & Identidade', descricao: 'Provedores de nuvem e gestão de identidade' },
  armazenamento: { nome: 'Armazenamento', descricao: 'Armazenamento e backup de documentos' }
};

export function IntegrationHub() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [configuredIntegrations, setConfiguredIntegrations] = useState<IntegrationConfig[]>([]);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [logViewerOpen, setLogViewerOpen] = useState(false);
  
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
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('user_id', userData.user.id)
        .single();

      if (profile?.empresa_id) {
        setEmpresaId(profile.empresa_id);
        const { data, error } = await supabase
          .from('integracoes_config')
          .select('*')
          .eq('empresa_id', profile.empresa_id);

        if (error) throw error;
        setConfiguredIntegrations((data || []).map(d => ({
          id: d.id,
          tipo_integracao: d.tipo_integracao,
          status: d.status,
          configuracoes: d.configuracoes,
          ultima_sincronizacao: d.ultima_sincronizacao
        })));
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
      toast({
        title: 'Em breve',
        description: `A integração com ${integration.nome} estará disponível em breve.`,
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
    const Logo = integration.Logo;

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
        {integration.disponivel && integration.betaLabel && (
          <Badge variant="outline" className="absolute top-3 right-3 text-xs border-primary/30 text-primary">
            {integration.betaLabel}
          </Badge>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div 
              className="p-2 rounded-lg flex items-center justify-center" 
              style={{ backgroundColor: `${integration.cor}15` }}
            >
              <Logo />
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
              disabled={!integration.disponivel}
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
    <div className="space-y-6">
      <Tabs defaultValue="conectores" className="space-y-6">
        <TabsList>
          <TabsTrigger value="conectores" className="gap-2">
            <Plug className="h-4 w-4" /> Conectores
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="gap-2">
            <Key className="h-4 w-4" /> API Keys
          </TabsTrigger>
          <TabsTrigger value="inbound-webhooks" className="gap-2">
            <Webhook className="h-4 w-4" /> Webhooks de Entrada
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conectores">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border flex-1">
                <Info className="h-5 w-5 text-primary shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Conecte o Akuris com suas ferramentas favoritas para automatizar processos e receber notificações em tempo real.
                </p>
              </div>
              <Button variant="outline" className="ml-4" onClick={() => setLogViewerOpen(true)}>
                <History className="h-4 w-4 mr-2" />
                Ver Logs
              </Button>
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
          </div>
        </TabsContent>

        <TabsContent value="api-keys">
          <ApiKeysManager />
        </TabsContent>

        <TabsContent value="inbound-webhooks">
          <InboundWebhooksManager />
        </TabsContent>
      </Tabs>

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

      <IntegrationLogViewer open={logViewerOpen} onOpenChange={setLogViewerOpen} />
    </div>
  );
}
