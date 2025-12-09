import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Server, Activity, AlertTriangle, TrendingUp, Wrench, History, Upload, Download, Shield, CloudCog, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAtivosStats } from '@/hooks/useAtivosStats';
import LocalizacaoSelect from '@/components/ativos/LocalizacaoSelect';
import ManutencaoDialog from '@/components/ativos/ManutencaoDialog';
import TrilhaAuditoriaAtivos from '@/components/ativos/TrilhaAuditoriaAtivos';
import ImportacaoAtivos from '@/components/ativos/ImportacaoAtivos';
import { UserSelect } from '@/components/riscos/UserSelect';
import { formatDateOnly } from '@/lib/date-utils';

interface Ativo {
  id: string;
  nome: string;
  tipo: string;
  descricao: string | null;
  proprietario: string | null;
  proprietario_nome?: string | null;
  proprietario_avatar?: string | null;
  localizacao: string | null;
  valor_negocio: string | null;
  criticidade: string;
  status: string;
  data_aquisicao: string | null;
  fornecedor: string | null;
  versao: string | null;
  tags: string[] | null;
  imei: string | null;
  cliente: string | null;
  quantidade: number | null;
  created_at: string;
  manutencoes_count?: number;
}

const tiposAtivo = [
  // Tecnologia da Informação
  { value: 'servidor', label: 'Servidor' },
  { value: 'aplicacao', label: 'Aplicação' },
  { value: 'banco_dados', label: 'Banco de Dados' },
  { value: 'rede', label: 'Equipamento de Rede' },
  { value: 'endpoint', label: 'Endpoint' },
  { value: 'dispositivo_movel', label: 'Dispositivo Móvel' },
  { value: 'armazenamento', label: 'Armazenamento' },
  { value: 'software', label: 'Software' },
  { value: 'hardware', label: 'Hardware' },
  
  // Almoxarifado
  { value: 'almoxarifado_equipamento', label: 'Equipamento de Almoxarifado' },
  { value: 'almoxarifado_ferramenta', label: 'Ferramenta' },
  { value: 'almoxarifado_material', label: 'Material de Consumo' },
  { value: 'almoxarifado_epi', label: 'Equipamento de Proteção Individual' },
  
  // Escritório
  { value: 'mobiliario', label: 'Mobiliário' },
  { value: 'equipamento_escritorio', label: 'Equipamento de Escritório' },
  { value: 'equipamento_comunicacao', label: 'Equipamento de Comunicação' },
  { value: 'material_escritorio', label: 'Material de Escritório' },
  
  // Veículos e Transporte
  { value: 'veiculo_terrestre', label: 'Veículo Terrestre' },
  { value: 'veiculo_aereo', label: 'Veículo Aéreo' },
  { value: 'maquina_pesada', label: 'Máquina Pesada' },
  { value: 'equipamento_transporte', label: 'Equipamento de Transporte' },
  
  // Instalações e Infraestrutura
  { value: 'imovel', label: 'Imóvel' },
  { value: 'estrutura_fisica', label: 'Estrutura Física' },
  { value: 'instalacao_eletrica', label: 'Instalação Elétrica' },
  { value: 'instalacao_hidraulica', label: 'Instalação Hidráulica' },
  
  // Segurança
  { value: 'equipamento_seguranca', label: 'Equipamento de Segurança' },
  { value: 'sistema_monitoramento', label: 'Sistema de Monitoramento' },
  { value: 'controle_acesso', label: 'Controle de Acesso' },
  { value: 'equipamento_bombeiro', label: 'Equipamento de Combate a Incêndio' },
  
  // Produção e Operações
  { value: 'maquina_producao', label: 'Máquina de Produção' },
  { value: 'ferramenta_producao', label: 'Ferramenta de Produção' },
  { value: 'equipamento_medicao', label: 'Equipamento de Medição' },
  { value: 'equipamento_teste', label: 'Equipamento de Teste' },
  
  // Outros
  { value: 'equipamento_medico', label: 'Equipamento Médico' },
  { value: 'equipamento_laboratorio', label: 'Equipamento de Laboratório' },
  { value: 'outros', label: 'Outros' }
];

const criticidades = [
  { value: 'critico', label: 'Crítico', color: 'destructive' },
  { value: 'alto', label: 'Alto', color: 'warning' },
  { value: 'medio', label: 'Médio', color: 'default' },
  { value: 'baixo', label: 'Baixo', color: 'secondary' },
];

const statusOptions = [
  { value: 'ativo', label: 'Ativo', color: 'success' },
  { value: 'inativo', label: 'Inativo', color: 'secondary' },
  { value: 'descontinuado', label: 'Descontinuado', color: 'destructive' },
];

const valoresNegocio = ['alto', 'medio', 'baixo'];

const Ativos = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: stats, isLoading: statsLoading } = useAtivosStats();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Estados para filtros
  const [statusFilter, setStatusFilter] = useState('todos');
  const [criticidadeFilter, setCriticidadeFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [valorNegocioFilter, setValorNegocioFilter] = useState('todos');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [manutencaoDialog, setManutencaoDialog] = useState<{open: boolean, ativoId: string, ativoNome: string}>({open: false, ativoId: '', ativoNome: ''});
  const [auditDialog, setAuditDialog] = useState<{open: boolean, ativoId?: string}>({open: false});
  const [importDialog, setImportDialog] = useState(false);
  const [azureSyncing, setAzureSyncing] = useState(false);

  // Check if Azure integration is configured
  const [azureIntegration, setAzureIntegration] = useState<{
    id: string;
    configuracoes: any;
  } | null>(null);

  useEffect(() => {
    const fetchAzureIntegration = async () => {
      if (!profile?.empresa_id) return;
      try {
        // @ts-ignore - Supabase type recursion issue
        const result = await supabase
          .from('integracoes_config')
          .select('id, configuracoes')
          .eq('empresa_id', profile.empresa_id)
          .eq('tipo_integracao', 'azure')
          .eq('ativo', true)
          .limit(1);
        
        if (result.data && result.data.length > 0) {
          setAzureIntegration(result.data[0]);
        }
      } catch (e) {
        console.error('Error fetching azure integration:', e);
        setAzureIntegration(null);
      }
    };
    fetchAzureIntegration();
  }, [profile?.empresa_id]);

  const handleAzureSync = async () => {
    if (!azureIntegration || !profile?.empresa_id) return;

    setAzureSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('azure-integration', {
        body: {
          action: 'sync',
          empresa_id: profile.empresa_id,
          config: azureIntegration.configuracoes
        }
      });

      if (error) throw error;

      toast({
        title: "Sincronização concluída",
        description: `${data.synced_count || 0} dispositivos sincronizados do Azure/Intune`,
      });
      
      fetchAtivos();
    } catch (error: any) {
      console.error('Azure sync error:', error);
      toast({
        title: "Erro na sincronização",
        description: error.message || "Falha ao sincronizar com Azure",
        variant: "destructive",
      });
    } finally {
      setAzureSyncing(false);
    }
  };
  const [editingAtivo, setEditingAtivo] = useState<Ativo | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; ativoId: string }>({
    open: false,
    ativoId: ''
  });
  const [formData, setFormData] = useState({
    nome: '',
    tipo: '',
    descricao: '',
    proprietario: '',
    localizacao: '',
    valor_negocio: '',
    criticidade: 'medio',
    status: 'ativo',
    data_aquisicao: '',
    fornecedor: '',
    versao: '',
    tags: '',
    imei: '',
    cliente: '',
    quantidade: 1,
  });

  useEffect(() => {
    fetchAtivos();
  }, []);

  const fetchAtivos = async () => {
    try {
      const { data, error } = await supabase
        .from('ativos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user names for proprietarios and maintenance counts
      if (data && data.length > 0) {
        const proprietarioIds = data
          .map(a => a.proprietario)
          .filter(p => p && p.trim() !== '');
        
        const ativoIds = data.map(a => a.id);
        
        // Fetch maintenance counts
        const { data: manutencoesCounts, error: manutencoesError } = await supabase
          .from('ativos_manutencoes')
          .select('ativo_id')
          .in('ativo_id', ativoIds);
        
        const countMap = new Map<string, number>();
        if (!manutencoesError && manutencoesCounts) {
          manutencoesCounts.forEach(m => {
            countMap.set(m.ativo_id, (countMap.get(m.ativo_id) || 0) + 1);
          });
        }
        
        if (proprietarioIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .rpc('get_profiles_by_text_ids', { text_ids: proprietarioIds });

          if (profilesError) {
            console.error('Erro ao buscar profiles:', profilesError);
            setAtivos(data.map(ativo => ({
              ...ativo,
              manutencoes_count: countMap.get(ativo.id) || 0
            })));
          } else {
            const profileMap = new Map(
              profiles?.map((p: any) => [p.user_id.toString(), { nome: p.nome, foto_url: p.foto_url }]) || []
            );
            
            const mappedData = data.map(ativo => {
              const profileData = (ativo.proprietario && ativo.proprietario.trim() !== '') 
                ? profileMap.get(ativo.proprietario) 
                : null;
              
              return {
                ...ativo,
                proprietario_nome: profileData?.nome || null,
                proprietario_avatar: profileData?.foto_url || null,
                manutencoes_count: countMap.get(ativo.id) || 0
              };
            });
            
            setAtivos(mappedData);
          }
        } else {
          setAtivos(data.map(ativo => ({
            ...ativo,
            manutencoes_count: countMap.get(ativo.id) || 0
          })));
        }
      } else {
        setAtivos(data || []);
      }
    } catch (error) {
      console.error('Error fetching ativos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar ativos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.empresa_id) {
      toast({
        title: "Erro",
        description: "Usuário deve estar vinculado a uma empresa",
        variant: "destructive",
      });
      return;
    }

    try {
      const ativoData = {
        ...formData,
        empresa_id: profile.empresa_id,
        proprietario: formData.proprietario || null,
        localizacao: formData.localizacao || null,
        data_aquisicao: formData.data_aquisicao || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : null,
      };

      if (editingAtivo) {
        const { error } = await supabase
          .from('ativos')
          .update(ativoData)
          .eq('id', editingAtivo.id);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Ativo atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('ativos')
          .insert(ativoData);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Ativo criado com sucesso!",
        });
      }

      setIsDialogOpen(false);
      setEditingAtivo(null);
      resetForm();
      fetchAtivos();
    } catch (error: any) {
      console.error('Error saving ativo:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar ativo",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (ativo: Ativo) => {
    setEditingAtivo(ativo);
    setFormData({
      nome: ativo.nome,
      tipo: ativo.tipo,
      descricao: ativo.descricao || '',
      proprietario: ativo.proprietario || '',
      localizacao: ativo.localizacao || '',
      valor_negocio: ativo.valor_negocio || '',
      criticidade: ativo.criticidade,
      status: ativo.status,
      data_aquisicao: ativo.data_aquisicao || '',
      fornecedor: ativo.fornecedor || '',
      versao: ativo.versao || '',
      tags: ativo.tags ? ativo.tags.join(', ') : '',
      imei: ativo.imei || '',
      cliente: ativo.cliente || '',
      quantidade: ativo.quantidade || 1,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ open: true, ativoId: id });
  };

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from('ativos')
        .delete()
        .eq('id', deleteConfirm.ativoId);

      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Ativo excluído com sucesso!",
      });
      fetchAtivos();
    } catch (error: any) {
      console.error('Error deleting ativo:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir ativo",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: '',
      descricao: '',
      proprietario: '',
      localizacao: '',
      valor_negocio: '',
      criticidade: 'medio',
      status: 'ativo',
      data_aquisicao: '',
      fornecedor: '',
      versao: '',
      tags: '',
      imei: '',
      cliente: '',
      quantidade: 1,
    });
  };

  const getTipoLabel = (value: string) => {
    const tipo = tiposAtivo.find(t => t.value === value);
    return tipo?.label || value;
  };

  const getCriticidadeColor = (criticidade: string) => {
    const crit = criticidades.find(c => c.value === criticidade);
    return crit?.color || 'default';
  };

  const getStatusColor = (status: string) => {
    const stat = statusOptions.find(s => s.value === status);
    return stat?.color || 'default';
  };

  // Filter and sort data
  const filteredAndSortedAtivos = useMemo(() => {
    let filtered = ativos.filter(ativo => {
      const matchesSearch = searchTerm === '' || 
        ativo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ativo.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ativo.proprietario_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ativo.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ativo.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ativo.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'todos' || ativo.status === statusFilter;
      const matchesCriticidade = criticidadeFilter === 'todos' || ativo.criticidade === criticidadeFilter;
      const matchesTipo = tipoFilter === 'todos' || ativo.tipo === tipoFilter;
      const matchesValorNegocio = valorNegocioFilter === 'todos' || ativo.valor_negocio === valorNegocioFilter;

      return matchesSearch && matchesStatus && matchesCriticidade && matchesTipo && matchesValorNegocio;
    });

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortField as keyof Ativo];
      const bValue = b[sortField as keyof Ativo];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }

      if ((aValue ?? '') < (bValue ?? '')) return sortDirection === 'asc' ? -1 : 1;
      if ((aValue ?? '') > (bValue ?? '')) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [ativos, searchTerm, statusFilter, criticidadeFilter, tipoFilter, valorNegocioFilter, sortField, sortDirection]);

  const exportData = () => {
    const csvContent = [
      ['Nome', 'Tipo', 'Status', 'Criticidade', 'Proprietário', 'Localização', 'Data Aquisição'].join(','),
      ...filteredAndSortedAtivos.map(ativo => [
        ativo.nome,
        getTipoLabel(ativo.tipo),
        statusOptions.find(s => s.value === ativo.status)?.label || ativo.status,
        criticidades.find(c => c.value === ativo.criticidade)?.label || ativo.criticidade,
        ativo.proprietario_nome || '',
        ativo.localizacao || '',
        ativo.data_aquisicao ? formatDateOnly(ativo.data_aquisicao) : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ativos-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Column configuration
  const columns: Column<Ativo>[] = [
    {
      key: 'nome',
      label: 'Nome',
      sortable: true,
      render: (_: any, ativo: Ativo) => <span className="font-medium">{ativo.nome}</span>
    },
    {
      key: 'tipo',
      label: 'Tipo',
      sortable: true,
      render: (_: any, ativo: Ativo) => getTipoLabel(ativo.tipo)
    },
    {
      key: 'criticidade',
      label: 'Criticidade',
      sortable: true,
      render: (_: any, ativo: Ativo) => (
        <Badge variant={getCriticidadeColor(ativo.criticidade) as any}>
          {criticidades.find(c => c.value === ativo.criticidade)?.label || ativo.criticidade}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: any, ativo: Ativo) => (
        <Badge variant={getStatusColor(ativo.status) as any}>
          {statusOptions.find(s => s.value === ativo.status)?.label || ativo.status}
        </Badge>
      )
    },
    {
      key: 'proprietario',
      label: 'Proprietário',
      render: (_: any, ativo: Ativo) => {
        if (!ativo.proprietario_nome) return '-';
        
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  {ativo.proprietario_avatar && (
                    <AvatarImage src={ativo.proprietario_avatar} alt={ativo.proprietario_nome} />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {ativo.proprietario_nome
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{ativo.proprietario_nome}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
    },
    {
      key: 'manutencoes_count',
      label: 'Manutenções',
      sortable: true,
      render: (_: any, ativo: Ativo) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-muted flex items-center gap-1"
                onClick={() => setManutencaoDialog({open: true, ativoId: ativo.id, ativoNome: ativo.nome})}
              >
                <Wrench className="h-3 w-3" />
                {ativo.manutencoes_count || 0}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clique para ver manutenções</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    },
    {
      key: 'localizacao',
      label: 'Localização',
      sortable: true,
      render: (_: any, ativo: Ativo) => ativo.localizacao || '-'
    },
    {
      key: 'acoes',
      label: 'Ações',
      render: (_: any, ativo: Ativo) => (
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(ativo)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar ativo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setManutencaoDialog({open: true, ativoId: ativo.id, ativoNome: ativo.nome})}
                >
                  <Wrench className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Manutenções</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(ativo.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Excluir ativo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    }
  ];

  // Filter configuration
  const filters = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: 'todos', label: 'Todos os status' },
        ...statusOptions.map(status => ({ value: status.value, label: status.label }))
      ]
    },
    {
      key: 'criticidade',
      label: 'Criticidade',
      value: criticidadeFilter,
      onChange: setCriticidadeFilter,
      options: [
        { value: 'todos', label: 'Todas' },
        ...criticidades.map(crit => ({ value: crit.value, label: crit.label }))
      ]
    },
    {
      key: 'tipo',
      label: 'Tipo',
      value: tipoFilter,
      onChange: setTipoFilter,
      options: [
        { value: 'todos', label: 'Todos os tipos' },
        ...tiposAtivo.map(tipo => ({ value: tipo.value, label: tipo.label }))
      ]
    },
    {
      key: 'valor_negocio',
      label: 'Valor de Negócio',
      value: valorNegocioFilter,
      onChange: setValorNegocioFilter,
      options: [
        { value: 'todos', label: 'Todos' },
        ...valoresNegocio.map(valor => ({ value: valor, label: valor.charAt(0).toUpperCase() + valor.slice(1) }))
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Ativos"
        description="Gerencie todos os ativos da organização de forma centralizada"
        actions={
          azureIntegration && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    onClick={handleAzureSync}
                    disabled={azureSyncing}
                    className="gap-2"
                  >
                    {azureSyncing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CloudCog className="h-4 w-4" />
                    )}
                    Sincronizar Azure
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sincronizar dispositivos do Microsoft Intune/Azure AD</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>
                  {editingAtivo ? 'Editar Ativo' : 'Novo Ativo'}
                </DialogTitle>
                <DialogDescription>
                  {editingAtivo ? 'Atualize as informações do ativo' : 'Cadastre um novo ativo na plataforma'}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[calc(90vh-140px)]">
              <form onSubmit={handleSubmit} className="space-y-4 pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({...prev, nome: e.target.value}))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo *</Label>
                    <Select value={formData.tipo} onValueChange={(value) => setFormData(prev => ({...prev, tipo: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposAtivo.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({...prev, descricao: e.target.value}))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="proprietario">Proprietário</Label>
                    <UserSelect
                      value={formData.proprietario}
                      onValueChange={(value) => setFormData(prev => ({...prev, proprietario: value}))}
                      placeholder="Selecionar proprietário..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="localizacao">Localização</Label>
                    <LocalizacaoSelect
                      value={formData.localizacao}
                      onValueChange={(value) => setFormData(prev => ({...prev, localizacao: value}))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cliente">Cliente</Label>
                    <Input
                      id="cliente"
                      value={formData.cliente}
                      onChange={(e) => setFormData(prev => ({...prev, cliente: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imei">IMEI</Label>
                    <Input
                      id="imei"
                      value={formData.imei}
                      onChange={(e) => setFormData(prev => ({...prev, imei: e.target.value}))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData(prev => ({...prev, tags: e.target.value}))}
                      placeholder="Ex: servidor, crítico, backup (separadas por vírgula)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      min="1"
                      value={formData.quantidade}
                      onChange={(e) => setFormData(prev => ({...prev, quantidade: parseInt(e.target.value) || 1}))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="criticidade">Criticidade</Label>
                    <Select value={formData.criticidade} onValueChange={(value) => setFormData(prev => ({...prev, criticidade: value}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {criticidades.map((crit) => (
                          <SelectItem key={crit.value} value={crit.value}>
                            {crit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor_negocio">Valor de Negócio</Label>
                    <Select value={formData.valor_negocio} onValueChange={(value) => setFormData(prev => ({...prev, valor_negocio: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {valoresNegocio.map((valor) => (
                          <SelectItem key={valor} value={valor}>
                            {valor.charAt(0).toUpperCase() + valor.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({...prev, status: value}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_aquisicao">Data de Aquisição</Label>
                    <Input
                      id="data_aquisicao"
                      type="date"
                      value={formData.data_aquisicao}
                      onChange={(e) => setFormData(prev => ({...prev, data_aquisicao: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fornecedor">Fornecedor</Label>
                    <Input
                      id="fornecedor"
                      value={formData.fornecedor}
                      onChange={(e) => setFormData(prev => ({...prev, fornecedor: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="versao">Versão</Label>
                    <Input
                      id="versao"
                      value={formData.versao}
                      onChange={(e) => setFormData(prev => ({...prev, versao: e.target.value}))}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingAtivo ? 'Atualizar' : 'Criar'} Ativo
                  </Button>
                </div>
              </form>
              </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Ativos"
          value={stats?.total || 0}
          description={`Críticos: ${stats?.criticos || 0} | Altos: ${stats?.altos || 0}`}
          icon={<Server className="h-4 w-4 text-muted-foreground" />}
          variant={stats?.criticos ? "destructive" : "default"}
          loading={statsLoading}
        />

        <StatCard
          title="Ativos"
          value={stats?.ativos || 0}
          description={`${stats?.inativos || 0} inativos | ${stats?.descontinuados || 0} descontinuados`}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          variant="success"
          loading={statsLoading}
        />

        <StatCard
          title="Alto Valor"
          value={stats?.altoValorNegocio || 0}
          description={`${stats?.percentualAltoValor || 0}% do total`}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          variant="warning"
          loading={statsLoading}
        />

        <StatCard
          title="Criticidade Alta"
          value={(stats?.criticos || 0) + (stats?.altos || 0)}
          description="Requerem atenção especial"
          icon={<Shield className="h-4 w-4 text-muted-foreground" />}
          variant="info"
          loading={statsLoading}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button onClick={() => setImportDialog(true)} variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Importar
        </Button>
        <Button onClick={() => setAuditDialog({open: true})} variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          Auditoria
        </Button>
        <Button size="sm" onClick={() => {
          setEditingAtivo(null);
          resetForm();
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Ativo
        </Button>
      </div>

      {/* DataTable */}
      <DataTable
        data={filteredAndSortedAtivos}
        columns={columns}
        loading={loading}
        searchable
        searchPlaceholder="Buscar ativos..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={(field) => {
          if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
          } else {
            setSortField(field);
            setSortDirection('asc');
          }
        }}
        onExport={exportData}
        onRefresh={fetchAtivos}
        emptyState={{
          icon: <Server className="h-8 w-8" />,
          title: searchTerm ? "Nenhum ativo encontrado" : "Nenhum ativo cadastrado",
          description: searchTerm 
            ? "Tente ajustar os termos de busca ou limpe os filtros."
            : "Comece cadastrando os ativos da sua organização.",
          action: !searchTerm ? {
            label: "Cadastrar Primeiro Ativo",
            onClick: () => setIsDialogOpen(true)
          } : undefined
        }}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        onConfirm={confirmDelete}
        title="Excluir Ativo"
        description="Tem certeza que deseja excluir este ativo? Esta ação não pode ser desfeita."
      />

      <ManutencaoDialog
        ativoId={manutencaoDialog.ativoId}
        ativoNome={manutencaoDialog.ativoNome}
        open={manutencaoDialog.open}
        onOpenChange={(open) => setManutencaoDialog({...manutencaoDialog, open})}
      />

      <TrilhaAuditoriaAtivos
        ativoId={auditDialog.ativoId}
        open={auditDialog.open}
        onOpenChange={(open) => setAuditDialog({...auditDialog, open})}
      />

      <ImportacaoAtivos
        open={importDialog}
        onOpenChange={setImportDialog}
        onSuccess={fetchAtivos}
      />

    </div>
  );
};

export default Ativos;
