import { useState, useEffect } from "react";
import { Plus, Database, Users, FileText, AlertTriangle, Filter, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DadosPessoaisDialog } from "@/components/dados/DadosPessoaisDialog";
import { DadosPessoaisCard } from "@/components/dados/DadosPessoaisCard";
import { MapeamentoDialog } from "@/components/dados/MapeamentoDialog";
import { RopaWizard } from "@/components/dados/RopaWizard";
import { RopaDialog } from "@/components/dados/RopaDialog";
import { SolicitacaoTitularDialog } from "@/components/dados/SolicitacaoTitularDialog";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDateOnly } from '@/lib/date-utils';
import { formatStatus, getSensibilidadeColor, getItemStatusColor, getWorkflowStatusColor } from '@/lib/text-utils';

export default function Dados() {
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
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
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
      const [dadosRes, mapeamentosRes, ropaRes, solicitacoesRes] = await Promise.all([
        supabase.from('dados_pessoais').select('*').order('nome'),
        supabase.from('dados_mapeamento').select('id, dados_pessoais_id').order('created_at', { ascending: false }),
        supabase.from('ropa_registros').select('*').order('nome_tratamento'),
        supabase.from('dados_solicitacoes_titular').select('*, dados_pessoais(nome)').order('data_solicitacao', { ascending: false })
      ]);

      setDadosPessoais(dadosRes.data || []);
      setRopaRegistros(ropaRes.data || []);
      setSolicitacoes(solicitacoesRes.data || []);

      // Calcular estatísticas
      const dados = dadosRes.data || [];
      const sensiveis = dados.filter(d => d.tipo_dados === 'sensivel' || d.sensibilidade === 'muito_sensivel').length;
      const pendentes = (solicitacoesRes.data || []).filter(s => s.status === 'pendente').length;
      
      setStats({
        totalDados: dados.length,
        dadosSensiveis: sensiveis,
        mapeamentos: (mapeamentosRes.data || []).length,
        ropaAtivos: (ropaRes.data || []).filter(r => r.status === 'ativo').length,
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
    // Para status de itens (ativo/inativo) usa getItemStatusColor
    // Para status de workflow (pendente/atendida) usa getWorkflowStatusColor
    const isWorkflow = ['pendente', 'em_analise', 'atendida', 'rejeitada'].includes(status);
    const colorClass = isWorkflow ? getWorkflowStatusColor(status) : getItemStatusColor(status);
    return <Badge className={`${colorClass} border whitespace-nowrap`}>{formatStatus(status)}</Badge>;
  };

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
        title="Proteção de Dados"
        description="Mapeamento de dados e ROPA (LGPD)"
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="catalogo">Catálogo & Mapeamento</TabsTrigger>
          <TabsTrigger value="ropa">ROPA</TabsTrigger>
          <TabsTrigger value="solicitacoes">Solicitações</TabsTrigger>
        </TabsList>

        <TabsContent value="catalogo" className="space-y-4">
          <Card className="rounded-lg border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4 mb-6">
                <Input
                  placeholder="Buscar dados pessoais..."
                  className="max-w-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowMapeamentoDialog(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Mapear Dado
                  </Button>
                  <Button size="sm" onClick={() => setShowDadosDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Dado
                  </Button>
                </div>
              </div>

              {dadosPessoais.length === 0 ? (
                <EmptyState
                  icon={<Database className="h-8 w-8" />}
                  title="Nenhum dado catalogado"
                  description="Ainda não há dados pessoais catalogados. Comece criando o primeiro registro."
                  action={{
                    label: "Novo Dado",
                    onClick: () => setShowDadosDialog(true)
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dadosPessoais
                    .filter(dado => 
                      !searchTerm || 
                      dado.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      dado.categoria_dados.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((dado) => (
                      <DadosPessoaisCard
                        key={dado.id}
                        dado={dado}
                        onEdit={() => {
                          setSelectedDado(dado);
                          setShowDadosDialog(true);
                        }}
                        onDelete={() => handleDelete(dado.id, 'dados')}
                        onMapear={() => {
                          setSelectedDado(dado);
                          setShowMapeamentoDialog(true);
                        }}
                        onCriarRopa={() => {
                          setPreSelectedDadoId(dado.id);
                          setShowRopaWizard(true);
                        }}
                        onViewDetalhes={() => {
                          setSelectedDado(dado);
                          setShowDadoSheet(true);
                        }}
                      />
                    ))}
                </div>
              )}
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