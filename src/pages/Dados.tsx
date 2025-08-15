import { useState, useEffect } from "react";
import { Plus, Database, Users, FileText, ArrowRightLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DadosPessoaisDialog } from "@/components/dados/DadosPessoaisDialog";
import { MapeamentoDialog } from "@/components/dados/MapeamentoDialog";
import { RopaDialog } from "@/components/dados/RopaDialog";
import { FluxoDadosDialog } from "@/components/dados/FluxoDadosDialog";
import { SolicitacaoTitularDialog } from "@/components/dados/SolicitacaoTitularDialog";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";

export default function Dados() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dadosPessoais, setDadosPessoais] = useState<any[]>([]);
  const [mapeamentos, setMapeamentos] = useState<any[]>([]);
  const [ropaRegistros, setRopaRegistros] = useState<any[]>([]);
  const [fluxos, setFluxos] = useState<any[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalDados: 0,
    dadosSensiveis: 0,
    ativosComDados: 0,
    ropaAtivos: 0,
    solicitacoesPendentes: 0
  });
  
  const [showDadosDialog, setShowDadosDialog] = useState(false);
  const [showMapeamentoDialog, setShowMapeamentoDialog] = useState(false);
  const [showRopaDialog, setShowRopaDialog] = useState(false);
  const [showFluxoDialog, setShowFluxoDialog] = useState(false);
  const [showSolicitacaoDialog, setShowSolicitacaoDialog] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dadosRes, mapeamentosRes, ropaRes, fluxosRes, solicitacoesRes] = await Promise.all([
        supabase.from('dados_pessoais').select('*').order('nome'),
        supabase.from('dados_mapeamento').select('*, dados_pessoais(nome), ativos(nome)').order('created_at', { ascending: false }),
        supabase.from('ropa_registros').select('*').order('nome_tratamento'),
        supabase.from('dados_fluxos').select('*, dados_pessoais(nome)').order('nome_fluxo'),
        supabase.from('dados_solicitacoes_titular').select('*').order('data_solicitacao', { ascending: false })
      ]);

      setDadosPessoais(dadosRes.data || []);
      setMapeamentos(mapeamentosRes.data || []);
      setRopaRegistros(ropaRes.data || []);
      setFluxos(fluxosRes.data || []);
      setSolicitacoes(solicitacoesRes.data || []);

      // Calcular estatísticas
      const dados = dadosRes.data || [];
      const sensiveis = dados.filter(d => d.tipo_dados === 'sensivel' || d.sensibilidade === 'muito_sensivel').length;
      const pendentes = (solicitacoesRes.data || []).filter(s => s.status === 'pendente').length;
      
      setStats({
        totalDados: dados.length,
        dadosSensiveis: sensiveis,
        ativosComDados: new Set((mapeamentosRes.data || []).map(m => m.ativo_id)).size,
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
          title="ROPA Ativos"
          value={stats.ropaAtivos}
          description="Registros de processamento"
          icon={<FileText className="h-4 w-4" />}
          variant="success"
        />
        <StatCard
          title="Solicitações Pendentes"
          value={stats.solicitacoesPendentes}
          description="De titulares"
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="mapeamento">Mapeamento</TabsTrigger>
          <TabsTrigger value="ropa">ROPA</TabsTrigger>
          <TabsTrigger value="fluxos">Fluxos</TabsTrigger>
          <TabsTrigger value="solicitacoes">Solicitações</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Dados</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDados}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dados Sensíveis</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.dadosSensiveis}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ativos com Dados</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.ativosComDados}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ROPAs Ativas</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.ropaAtivos}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Solicitações Pendentes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary">{stats.solicitacoesPendentes}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="catalogo" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Catálogo de Dados Pessoais</h2>
            <Button onClick={() => setShowDadosDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Dado
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Sensibilidade</TableHead>
                  <TableHead>Base Legal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosPessoais.map((dado) => (
                  <TableRow key={dado.id}>
                    <TableCell className="font-medium">{dado.nome}</TableCell>
                    <TableCell>{dado.categoria_dados}</TableCell>
                    <TableCell>{dado.tipo_dados}</TableCell>
                    <TableCell>{getSensibilidadeBadge(dado.tipo_dados, dado.sensibilidade)}</TableCell>
                    <TableCell>{dado.base_legal}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="mapeamento" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Mapeamento Dados x Ativos</h2>
            <Button onClick={() => setShowMapeamentoDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Mapeamento
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dados Pessoais</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead>Tipo Armazenamento</TableHead>
                  <TableHead>Criptografia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mapeamentos.map((mapeamento) => (
                  <TableRow key={mapeamento.id}>
                    <TableCell>{mapeamento.dados_pessoais?.nome}</TableCell>
                    <TableCell>{mapeamento.ativos?.nome}</TableCell>
                    <TableCell>{mapeamento.tipo_armazenamento}</TableCell>
                    <TableCell>{mapeamento.criptografia_aplicada ? "Sim" : "Não"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="ropa" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Registros ROPA</h2>
            <Button onClick={() => setShowRopaDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo ROPA
            </Button>
          </div>
          <Card>
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
                {ropaRegistros.map((ropa) => (
                  <TableRow key={ropa.id}>
                    <TableCell className="font-medium">{ropa.nome_tratamento}</TableCell>
                    <TableCell>{ropa.base_legal}</TableCell>
                    <TableCell>{ropa.categoria_titulares}</TableCell>
                    <TableCell>{getStatusBadge(ropa.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="fluxos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Fluxos de Dados</h2>
            <Button onClick={() => setShowFluxoDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Fluxo
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Fluxo</TableHead>
                  <TableHead>Dados</TableHead>
                  <TableHead>Origem → Destino</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fluxos.map((fluxo) => (
                  <TableRow key={fluxo.id}>
                    <TableCell className="font-medium">{fluxo.nome_fluxo}</TableCell>
                    <TableCell>{fluxo.dados_pessoais?.nome}</TableCell>
                    <TableCell className="flex items-center">
                      {fluxo.sistema_origem} <ArrowRightLeft className="mx-2 h-3 w-3" /> {fluxo.sistema_destino}
                    </TableCell>
                    <TableCell>{getStatusBadge(fluxo.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="solicitacoes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Solicitações de Titulares</h2>
            <Button onClick={() => setShowSolicitacaoDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Solicitação
            </Button>
          </div>
          <Card>
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
                {solicitacoes.map((solicitacao) => (
                  <TableRow key={solicitacao.id}>
                    <TableCell>{solicitacao.tipo_solicitacao}</TableCell>
                    <TableCell>{JSON.parse(solicitacao.dados_titular).nome}</TableCell>
                    <TableCell>{solicitacao.canal_solicitacao}</TableCell>
                    <TableCell>{getStatusBadge(solicitacao.status)}</TableCell>
                    <TableCell>{new Date(solicitacao.prazo_resposta).toLocaleDateString('pt-BR')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <DadosPessoaisDialog
        isOpen={showDadosDialog}
        onClose={() => setShowDadosDialog(false)}
        onSave={loadData}
      />
      <MapeamentoDialog
        isOpen={showMapeamentoDialog}
        onClose={() => setShowMapeamentoDialog(false)}
        onSave={loadData}
      />
      <RopaDialog
        isOpen={showRopaDialog}
        onClose={() => setShowRopaDialog(false)}
        onSave={loadData}
      />
      <FluxoDadosDialog
        isOpen={showFluxoDialog}
        onClose={() => setShowFluxoDialog(false)}
        onSave={loadData}
      />
      <SolicitacaoTitularDialog
        isOpen={showSolicitacaoDialog}
        onClose={() => setShowSolicitacaoDialog(false)}
        onSave={loadData}
      />
    </div>
  );
}