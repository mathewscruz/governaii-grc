import { useState, useEffect } from "react";
import { Plus, Database, Users, AlertTriangle, Edit, Trash2, Link2, FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DadosPessoaisDialog } from "@/components/dados/DadosPessoaisDialog";
import { MapeamentoDialog } from "@/components/dados/MapeamentoDialog";
import { RopaWizard } from "@/components/dados/RopaWizard";
import { RopaDialog } from "@/components/dados/RopaDialog";
import { SolicitacaoTitularDialog } from "@/components/dados/SolicitacaoTitularDialog";
import { DescoberDadosTab } from "@/components/dados/DescoberDadosTab";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDateOnly } from '@/lib/date-utils';
import { formatStatus, getSensibilidadeColor, getItemStatusColor, getWorkflowStatusColor } from '@/lib/text-utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Privacidade() {
  const [activeTab, setActiveTab] = useState("catalogo");
  const [dadosPessoais, setDadosPessoais] = useState<any[]>([]);
  const [ropaRegistros, setRopaRegistros] = useState<any[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalDados: 0,
    dadosSensiveis: 0,
    mapeamentos: 0,
    ropaAtivos: 0,
    solicitacoesPendentes: 0
  });
  
  const [showDadosDialog, setShowDadosDialog] = useState(false);
  const [showMapeamentoDialog, setShowMapeamentoDialog] = useState(false);
  const [showRopaWizard, setShowRopaWizard] = useState(false);
  const [showRopaDialog, setShowRopaDialog] = useState(false);
  const [showSolicitacaoDialog, setShowSolicitacaoDialog] = useState(false);
  const [selectedDado, setSelectedDado] = useState<any>(null);
  const [selectedRopa, setSelectedRopa] = useState<any>(null);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<any>(null);
  const [showDadoSheet, setShowDadoSheet] = useState(false);
  const [preSelectedDadoId, setPreSelectedDadoId] = useState<string | undefined>();
  
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; type: string }>({
    open: false,
    id: '',
    type: ''
  });
  
  // States for Catálogo tab DataTable
  const [catalogoSortField, setCatalogoSortField] = useState<string>("");
  const [catalogoSortDirection, setCatalogoSortDirection] = useState<"asc" | "desc">("asc");
  const [categoriaFilter, setCategoriaFilter] = useState("todos");
  const [sensibilidadeFilter, setSensibilidadeFilter] = useState("todos");
  
  // States for ROPA tab DataTable
  const [searchRopaTerm, setSearchRopaTerm] = useState("");
  const [statusRopaFilter, setStatusRopaFilter] = useState("todos");
  const [baseLegalFilter, setBaseLegalFilter] = useState("todos");
  const [sortRopaField, setSortRopaField] = useState<string>("");
  const [sortRopaDirection, setSortRopaDirection] = useState<"asc" | "desc">("asc");
  
  // States for Solicitações tab DataTable
  const [searchSolicitacoesTerm, setSearchSolicitacoesTerm] = useState("");
  const [statusSolicitacoesFilter, setStatusSolicitacoesFilter] = useState("todos");
  const [tipoSolicitacaoFilter, setTipoSolicitacaoFilter] = useState("todos");
  const [sortSolicitacoesField, setSortSolicitacoesField] = useState<string>("");
  const [sortSolicitacoesDirection, setSortSolicitacoesDirection] = useState<"asc" | "desc">("asc");
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Query with aggregated counts for catalog
      const [dadosRes, mapeamentosRes, ropaRes, solicitacoesRes, ropaDadosRes] = await Promise.all([
        supabase.from('dados_pessoais').select('*').order('nome'),
        supabase.from('dados_mapeamento').select('id, dados_pessoais_id'),
        supabase.from('ropa_registros').select('*').order('nome_tratamento'),
        supabase.from('dados_solicitacoes_titular').select('*, dados_pessoais(nome)').order('data_solicitacao', { ascending: false }),
        supabase.from('ropa_dados_vinculados').select('id, dados_pessoais_id')
      ]);

      // Aggregate counts per dados_pessoais_id
      const mapeamentosCounts: Record<string, number> = {};
      (mapeamentosRes.data || []).forEach((m: any) => {
        mapeamentosCounts[m.dados_pessoais_id] = (mapeamentosCounts[m.dados_pessoais_id] || 0) + 1;
      });
      
      const ropasCounts: Record<string, number> = {};
      (ropaDadosRes.data || []).forEach((r: any) => {
        ropasCounts[r.dados_pessoais_id] = (ropasCounts[r.dados_pessoais_id] || 0) + 1;
      });

      // Enrich dados with counts
      const dadosEnriquecidos = (dadosRes.data || []).map((dado: any) => ({
        ...dado,
        mapeamentos_count: mapeamentosCounts[dado.id] || 0,
        ropas_count: ropasCounts[dado.id] || 0
      }));

      setDadosPessoais(dadosEnriquecidos);
      setRopaRegistros(ropaRes.data || []);
      setSolicitacoes(solicitacoesRes.data || []);

      // Calcular estatísticas
      const dados = dadosRes.data || [];
      const sensiveis = dados.filter((d: any) => d.tipo_dados === 'sensivel' || d.sensibilidade === 'muito_sensivel').length;
      const pendentes = (solicitacoesRes.data || []).filter((s: any) => s.status === 'pendente').length;
      
      setStats({
        totalDados: dados.length,
        dadosSensiveis: sensiveis,
        mapeamentos: (mapeamentosRes.data || []).length,
        ropaAtivos: (ropaRes.data || []).filter((r: any) => r.status === 'ativo').length,
        solicitacoesPendentes: pendentes
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    }
  };

  const getSensibilidadeBadge = (tipo: string, sensibilidade: string) => {
    const colorClass = getSensibilidadeColor(tipo, sensibilidade);
    const label = (tipo === 'sensivel' || sensibilidade === 'muito_sensivel') 
      ? 'Sensível' 
      : sensibilidade === 'sensivel' 
        ? 'Moderado' 
        : 'Comum';
    return <Badge className={`${colorClass} border whitespace-nowrap`}>{label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const isWorkflow = ['pendente', 'em_analise', 'atendida', 'rejeitada'].includes(status);
    const colorClass = isWorkflow ? getWorkflowStatusColor(status) : getItemStatusColor(status);
    return <Badge className={`${colorClass} border whitespace-nowrap`}>{formatStatus(status)}</Badge>;
  };

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      identificacao: 'Identificação',
      contato: 'Contato',
      localizacao: 'Localização',
      financeiro: 'Financeiro',
      saude: 'Saúde',
      biometrico: 'Biométrico',
      comportamental: 'Comportamental',
      outros: 'Outros'
    };
    return labels[categoria] || formatStatus(categoria);
  };

  // Catálogo DataTable columns
  const catalogoColumns = [
    {
      key: 'nome',
      label: 'Nome',
      sortable: true,
      render: (value: string, row: any) => (
        <div>
          <span className="font-medium cursor-pointer hover:text-primary" onClick={() => {
            setSelectedDado(row);
            setShowDadoSheet(true);
          }}>{value}</span>
          {row.descricao && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{row.descricao}</p>
          )}
        </div>
      )
    },
    {
      key: 'categoria_dados',
      label: 'Categoria',
      sortable: true,
      render: (value: string) => <Badge variant="outline">{getCategoriaLabel(value)}</Badge>
    },
    {
      key: 'sensibilidade',
      label: 'Sensibilidade',
      sortable: true,
      render: (value: string, row: any) => getSensibilidadeBadge(row.tipo_dados, value)
    },
    {
      key: 'base_legal',
      label: 'Base Legal',
      sortable: true,
      render: (value: string) => value ? <Badge variant="secondary">{formatStatus(value)}</Badge> : <span className="text-muted-foreground">-</span>
    },
    {
      key: 'mapeamentos_count',
      label: 'Mapeamentos',
      sortable: true,
      render: (value: number) => value > 0 ? (
        <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">{value}</Badge>
      ) : <span className="text-muted-foreground">0</span>
    },
    {
      key: 'ropas_count',
      label: 'ROPAs',
      sortable: true,
      render: (value: number) => value > 0 ? (
        <Badge className="bg-green-500/20 text-green-600 border-green-500/30">{value}</Badge>
      ) : <span className="text-muted-foreground">0</span>
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (_: any, row: any) => (
        <TooltipProvider>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => {
                  setSelectedDado(row);
                  setShowDadoSheet(true);
                }}>
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver Detalhes</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => {
                  setSelectedDado(row);
                  setShowDadosDialog(true);
                }}>
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => {
                  setSelectedDado(row);
                  setShowMapeamentoDialog(true);
                }}>
                  <Link2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mapear</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => {
                  setPreSelectedDadoId(row.id);
                  setShowRopaWizard(true);
                }}>
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Criar ROPA</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id, 'dados')} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Excluir</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      )
    }
  ];

  const catalogoFilters = [
    {
      key: 'categoria_dados',
      label: 'Categoria',
      type: 'select' as const,
      options: [
        { value: 'identificacao', label: 'Identificação' },
        { value: 'contato', label: 'Contato' },
        { value: 'localizacao', label: 'Localização' },
        { value: 'financeiro', label: 'Financeiro' },
        { value: 'saude', label: 'Saúde' },
        { value: 'biometrico', label: 'Biométrico' },
        { value: 'comportamental', label: 'Comportamental' },
        { value: 'outros', label: 'Outros' }
      ],
      value: categoriaFilter,
      onChange: setCategoriaFilter
    },
    {
      key: 'sensibilidade',
      label: 'Sensibilidade',
      type: 'select' as const,
      options: [
        { value: 'comum', label: 'Comum' },
        { value: 'sensivel', label: 'Moderado' },
        { value: 'muito_sensivel', label: 'Sensível' }
      ],
      value: sensibilidadeFilter,
      onChange: setSensibilidadeFilter
    }
  ];

  // ROPA DataTable columns
  const ropaColumns = [
    {
      key: 'nome_tratamento',
      label: 'Nome do Tratamento',
      sortable: true,
      render: (value: string) => <span className="font-medium">{value}</span>
    },
    {
      key: 'base_legal',
      label: 'Base Legal',
      sortable: true,
      render: (value: string) => <Badge variant="outline">{value}</Badge>
    },
    {
      key: 'categoria_titulares',
      label: 'Categoria Titulares',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => getStatusBadge(value)
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (value: any, ropa: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedRopa(ropa);
              setShowRopaDialog(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(ropa.id, 'ropa')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const ropaFilters = [
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'ativo', label: 'Ativo' },
        { value: 'inativo', label: 'Inativo' },
        { value: 'revisao', label: 'Em Revisão' }
      ],
      value: statusRopaFilter,
      onChange: setStatusRopaFilter
    },
    {
      key: 'base_legal',
      label: 'Base Legal',
      type: 'select' as const,
      options: [
        { value: 'consentimento', label: 'Consentimento' },
        { value: 'legitimo_interesse', label: 'Legítimo Interesse' },
        { value: 'execucao_contrato', label: 'Execução de Contrato' },
        { value: 'cumprimento_obrigacao', label: 'Cumprimento de Obrigação Legal' }
      ],
      value: baseLegalFilter,
      onChange: setBaseLegalFilter
    }
  ];

  // Solicitações DataTable columns
  const solicitacoesColumns = [
    {
      key: 'tipo_solicitacao',
      label: 'Tipo',
      sortable: true,
      render: (value: string) => <Badge variant="outline">{value}</Badge>
    },
    {
      key: 'dados_titular',
      label: 'Titular',
      render: (value: string) => {
        try {
          const titular = JSON.parse(value);
          return titular.nome || '-';
        } catch {
          return '-';
        }
      }
    },
    {
      key: 'canal_solicitacao',
      label: 'Canal',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => getStatusBadge(value)
    },
    {
      key: 'prazo_resposta',
      label: 'Prazo',
      sortable: true,
      render: (value: string) => formatDateOnly(value)
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (value: any, solicitacao: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedSolicitacao(solicitacao);
              setShowSolicitacaoDialog(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(solicitacao.id, 'solicitacao')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const solicitacoesFilters = [
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'pendente', label: 'Pendente' },
        { value: 'em_analise', label: 'Em Análise' },
        { value: 'atendida', label: 'Atendida' },
        { value: 'rejeitada', label: 'Rejeitada' }
      ],
      value: statusSolicitacoesFilter,
      onChange: setStatusSolicitacoesFilter
    },
    {
      key: 'tipo_solicitacao',
      label: 'Tipo',
      type: 'select' as const,
      options: [
        { value: 'acesso', label: 'Acesso' },
        { value: 'correcao', label: 'Correção' },
        { value: 'exclusao', label: 'Exclusão' },
        { value: 'portabilidade', label: 'Portabilidade' },
        { value: 'oposicao', label: 'Oposição' },
        { value: 'revogacao_consentimento', label: 'Revogação de Consentimento' }
      ],
      value: tipoSolicitacaoFilter,
      onChange: setTipoSolicitacaoFilter
    }
  ];

  const handleDelete = (id: string, type: string) => {
    setDeleteConfirm({ open: true, id, type });
  };

  const confirmDelete = async () => {
    try {
      let error;

      // Use type-safe table operations
      switch (deleteConfirm.type) {
        case 'dados':
          ({ error } = await supabase.from('dados_pessoais').delete().eq('id', deleteConfirm.id));
          break;
        case 'mapeamento':
          ({ error } = await supabase.from('dados_mapeamento').delete().eq('id', deleteConfirm.id));
          break;
        case 'ropa':
          ({ error } = await supabase.from('ropa_registros').delete().eq('id', deleteConfirm.id));
          break;
        case 'fluxo':
          ({ error } = await supabase.from('dados_fluxos').delete().eq('id', deleteConfirm.id));
          break;
        case 'solicitacao':
          ({ error } = await supabase.from('dados_solicitacoes_titular').delete().eq('id', deleteConfirm.id));
          break;
        default:
          throw new Error('Tipo inválido');
      }

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item excluído com sucesso!",
      });

      loadData();
      setDeleteConfirm({ open: false, id: '', type: '' });
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir item",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Privacidade"
        description="Proteção de dados pessoais, mapeamento e ROPA (LGPD)"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Dados"
          value={stats.totalDados}
          description="Tipos catalogados"
          icon={<Database className="h-4 w-4" />}
        />
        <StatCard
          title="Dados Sensíveis"
          value={stats.dadosSensiveis}
          description="Requerem proteção especial"
          icon={<AlertTriangle className="h-4 w-4" />}
          variant="warning"
        />
        <StatCard
          title="Mapeamentos"
          value={stats.mapeamentos}
          description="Dados x Ativos"
          icon={<Database className="h-4 w-4" />}
        />
        <StatCard
          title="Solicitações Pendentes"
          value={stats.solicitacoesPendentes}
          description="De titulares"
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="catalogo">Catálogo & Mapeamento</TabsTrigger>
          <TabsTrigger value="ropa">ROPA</TabsTrigger>
          <TabsTrigger value="solicitacoes">Solicitações</TabsTrigger>
          <TabsTrigger value="descobertas">Descobertas</TabsTrigger>
        </TabsList>

        <TabsContent value="catalogo" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowMapeamentoDialog(true)}>
              <Link2 className="mr-2 h-4 w-4" />
              Mapear Dado
            </Button>
            <Button size="sm" onClick={() => setShowDadosDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Dado
            </Button>
          </div>
          <Card className="rounded-lg border overflow-hidden">
            <CardContent className="p-0">
              <DataTable
                data={dadosPessoais}
                columns={catalogoColumns}
                searchPlaceholder="Buscar dados pessoais..."
                filters={catalogoFilters}
                sortField={catalogoSortField}
                sortDirection={catalogoSortDirection}
                onSort={(field) => {
                  if (field === catalogoSortField) {
                    setCatalogoSortDirection(catalogoSortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setCatalogoSortField(field);
                    setCatalogoSortDirection('asc');
                  }
                }}
                emptyState={{
                  icon: <Database className="h-8 w-8" />,
                  title: "Nenhum dado catalogado",
                  description: "Ainda não há dados pessoais catalogados. Comece criando o primeiro registro.",
                  action: {
                    label: "Novo Dado",
                    onClick: () => setShowDadosDialog(true)
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ropa" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowRopaWizard(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo ROPA
            </Button>
          </div>
          <Card className="rounded-lg border overflow-hidden">
            <CardContent className="p-0">
              <DataTable
                data={ropaRegistros}
                columns={ropaColumns}
                loading={false}
                searchable
                searchPlaceholder="Buscar ROPA..."
                searchValue={searchRopaTerm}
                onSearchChange={setSearchRopaTerm}
                filters={ropaFilters}
                sortField={sortRopaField}
                sortDirection={sortRopaDirection}
                onSort={(field) => {
                  if (sortRopaField === field) {
                    setSortRopaDirection(sortRopaDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortRopaField(field);
                    setSortRopaDirection('asc');
                  }
                }}
                emptyState={{
                  icon: <FileText className="h-8 w-8" />,
                  title: "Nenhum registro ROPA criado",
                  description: "Ainda não há registros ROPA cadastrados. Comece criando o primeiro registro.",
                  action: {
                    label: "Novo ROPA",
                    onClick: () => setShowRopaWizard(true)
                  }
                }}
                onRefresh={loadData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solicitacoes" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowSolicitacaoDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Solicitação
            </Button>
          </div>
          <Card className="rounded-lg border overflow-hidden">
            <CardContent className="p-0">
              <DataTable
                data={solicitacoes}
                columns={solicitacoesColumns}
                loading={false}
                searchable
                searchPlaceholder="Buscar solicitações..."
                searchValue={searchSolicitacoesTerm}
                onSearchChange={setSearchSolicitacoesTerm}
                filters={solicitacoesFilters}
                sortField={sortSolicitacoesField}
                sortDirection={sortSolicitacoesDirection}
                onSort={(field) => {
                  if (sortSolicitacoesField === field) {
                    setSortSolicitacoesDirection(sortSolicitacoesDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortSolicitacoesField(field);
                    setSortSolicitacoesDirection('asc');
                  }
                }}
                emptyState={{
                  icon: <Users className="h-8 w-8" />,
                  title: "Nenhuma solicitação registrada",
                  description: "Ainda não há solicitações de titulares. Comece criando o primeiro registro.",
                  action: {
                    label: "Nova Solicitação",
                    onClick: () => setShowSolicitacaoDialog(true)
                  }
                }}
                onRefresh={loadData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="descobertas" className="space-y-4">
          <DescoberDadosTab onRefresh={loadData} />
        </TabsContent>
      </Tabs>

      <DadosPessoaisDialog
        isOpen={showDadosDialog}
        onClose={() => {
          setShowDadosDialog(false);
          setSelectedDado(null);
        }}
        onSave={loadData}
        dados={selectedDado}
      />
      <MapeamentoDialog
        isOpen={showMapeamentoDialog}
        onClose={() => {
          setShowMapeamentoDialog(false);
          setSelectedDado(null);
        }}
        onSave={loadData}
      />
      <RopaWizard
        isOpen={showRopaWizard}
        onClose={() => {
          setShowRopaWizard(false);
          setPreSelectedDadoId(undefined);
        }}
        onSave={loadData}
        preSelectedDadoId={preSelectedDadoId}
      />
      <SolicitacaoTitularDialog
        isOpen={showSolicitacaoDialog}
        onClose={() => {
          setShowSolicitacaoDialog(false);
          setSelectedSolicitacao(null);
        }}
        onSave={loadData}
        solicitacao={selectedSolicitacao}
      />
      
      <Sheet open={showDadoSheet} onOpenChange={setShowDadoSheet}>
        <SheetContent className="w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes do Dado Pessoal</SheetTitle>
          </SheetHeader>
          {selectedDado && (
            <div className="space-y-4 mt-6">
              <div>
                <h3 className="font-semibold mb-2">{selectedDado.nome}</h3>
                <p className="text-sm text-muted-foreground">{selectedDado.descricao}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Categoria</span>
                  <p className="font-medium">{selectedDado.categoria_dados}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Base Legal</span>
                  <p className="font-medium">{selectedDado.base_legal}</p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
        title="Excluir Item"
        description="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}