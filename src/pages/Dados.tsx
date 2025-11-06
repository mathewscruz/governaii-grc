import { useState, useEffect } from "react";
import { Plus, Database, Users, FileText, AlertTriangle, Filter, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DadosPessoaisDialog } from "@/components/dados/DadosPessoaisDialog";
import { DadosPessoaisCard } from "@/components/dados/DadosPessoaisCard";
import { MapeamentoDialog } from "@/components/dados/MapeamentoDialog";
import { RopaWizard } from "@/components/dados/RopaWizard";
import { SolicitacaoTitularDialog } from "@/components/dados/SolicitacaoTitularDialog";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDateOnly } from '@/lib/date-utils';

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
    if (tipo === 'sensivel' || sensibilidade === 'muito_sensivel') {
      return <Badge variant="destructive">Sensível</Badge>;
    }
    if (sensibilidade === 'sensivel') {
      return <Badge variant="secondary">Moderado</Badge>;
    }
    return <Badge variant="outline">Comum</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ativo: "default",
      pendente: "secondary",
      atendida: "outline",
      rejeitada: "destructive"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

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
          <Card className="rounded-lg border overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <Input
                    placeholder="Buscar ROPA..."
                    className="max-w-sm"
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
                     <Button size="sm" onClick={() => setShowRopaWizard(true)}>
                       <Plus className="mr-2 h-4 w-4" />
                       Novo ROPA
                     </Button>
                  </div>
                </div>
              </div>
              {showFilters && (
                <div className="flex gap-4 items-center flex-wrap p-4 bg-muted/50 rounded-lg mb-4">
                  <Input placeholder="Filtrar por status..." className="w-[180px]" />
                  <Input placeholder="Filtrar por base legal..." className="w-[180px]" />
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Tratamento</TableHead>
                    <TableHead>Base Legal</TableHead>
                    <TableHead>Categoria Titulares</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ropaRegistros.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="p-0">
                        <EmptyState
                          icon={<FileText className="h-8 w-8" />}
                          title="Nenhum registro ROPA criado"
                          description="Ainda não há registros ROPA cadastrados. Comece criando o primeiro registro."
                           action={{
                             label: "Novo ROPA",
                             onClick: () => setShowRopaWizard(true)
                           }}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    ropaRegistros.map((ropa) => (
                      <TableRow key={ropa.id}>
                        <TableCell className="font-medium">{ropa.nome_tratamento}</TableCell>
                        <TableCell>{ropa.base_legal}</TableCell>
                        <TableCell>{ropa.categoria_titulares}</TableCell>
                        <TableCell>{getStatusBadge(ropa.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solicitacoes" className="space-y-4">
          <Card className="rounded-lg border overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <Input
                    placeholder="Buscar solicitações..."
                    className="max-w-sm"
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
                    <Button size="sm" onClick={() => setShowSolicitacaoDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Solicitação
                    </Button>
                  </div>
                </div>
              </div>
              {showFilters && (
                <div className="flex gap-4 items-center flex-wrap p-4 bg-muted/50 rounded-lg mb-4">
                  <Input placeholder="Filtrar por status..." className="w-[180px]" />
                  <Input placeholder="Filtrar por tipo solicitação..." className="w-[180px]" />
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Titular</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prazo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {solicitacoes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="p-0">
                        <EmptyState
                          icon={<Users className="h-8 w-8" />}
                          title="Nenhuma solicitação registrada"
                          description="Ainda não há solicitações de titulares. Comece criando o primeiro registro."
                          action={{
                            label: "Nova Solicitação",
                            onClick: () => setShowSolicitacaoDialog(true)
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    solicitacoes.map((solicitacao) => (
                      <TableRow key={solicitacao.id}>
                        <TableCell>{solicitacao.tipo_solicitacao}</TableCell>
                        <TableCell>{JSON.parse(solicitacao.dados_titular).nome}</TableCell>
                        <TableCell>{solicitacao.canal_solicitacao}</TableCell>
                        <TableCell>{getStatusBadge(solicitacao.status)}</TableCell>
                        <TableCell>{formatDateOnly(solicitacao.prazo_resposta)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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