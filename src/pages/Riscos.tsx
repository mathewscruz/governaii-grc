import { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, TrendingUp, CheckCircle, Shield, Settings, Tag, Edit, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ConfirmDialog';
import { RiscoDialog } from '@/components/riscos/RiscoDialog';
import { MatrizDialog } from '@/components/riscos/MatrizDialog';
import { TratamentosList } from '@/components/riscos/TratamentosList';
import { CategoriasDialog } from '@/components/riscos/CategoriasDialog';

interface Risco {
  id: string;
  nome: string;
  descricao?: string;
  nivel_risco_inicial: string;
  nivel_risco_residual?: string;
  status: string;
  responsavel?: string;
  aceito: boolean;
  categoria?: { nome: string; cor?: string };
  matriz?: { nome: string };
  created_at: string;
}

interface RiscoStats {
  total: number;
  criticos: number;
  altos: number;
  medios: number;
  baixos: number;
  tratamentos_pendentes: number;
  tratamentos_andamento: number;
  tratamentos_concluidos: number;
  aceitos: number;
  tratados: number;
}

interface MatrizConfig {
  niveis_risco: Array<{ min: number; max: number; nivel: string; cor?: string }>;
}

export function Riscos() {
  const { profile } = useAuth();
  const [riscos, setRiscos] = useState<Risco[]>([]);
  const [stats, setStats] = useState<RiscoStats>({
    total: 0,
    criticos: 0,
    altos: 0,
    medios: 0,
    baixos: 0,
    tratamentos_pendentes: 0,
    tratamentos_andamento: 0,
    tratamentos_concluidos: 0,
    aceitos: 0,
    tratados: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [nivelFilter, setNivelFilter] = useState<string>('');
  const [riscoDialogOpen, setRiscoDialogOpen] = useState(false);
  const [matrizDialogOpen, setMatrizDialogOpen] = useState(false);
  const [editingRisco, setEditingRisco] = useState<Risco | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [riscoToDelete, setRiscoToDelete] = useState<Risco | null>(null);
  const [selectedRiscoForTratamentos, setSelectedRiscoForTratamentos] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('riscos');
  const [matrizConfig, setMatrizConfig] = useState<MatrizConfig | null>(null);
  const [categoriasDialogOpen, setCategoriasDialogOpen] = useState(false);

  const fetchRiscos = async () => {
    try {
      const { data, error } = await supabase
        .from('riscos')
        .select(`
          id,
          nome,
          descricao,
          nivel_risco_inicial,
          nivel_risco_residual,
          status,
          responsavel,
          aceito,
          created_at,
          categoria:riscos_categorias(nome, cor),
          matriz:riscos_matrizes(nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRiscos(data || []);
      calculateStats(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar riscos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatrizConfig = async () => {
    try {
      const { data } = await supabase
        .from('riscos_matriz_configuracao')
        .select('niveis_risco')
        .limit(1)
        .single();

      if (data) {
        setMatrizConfig({
          niveis_risco: data.niveis_risco as Array<{ min: number; max: number; nivel: string; cor?: string }>
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configuração da matriz:', error);
    }
  };

  const calculateStats = async (riscosData: Risco[]) => {
    const newStats: RiscoStats = {
      total: riscosData.length,
      criticos: riscosData.filter(r => r.nivel_risco_inicial === 'Crítico' || r.nivel_risco_inicial === 'Muito Alto').length,
      altos: riscosData.filter(r => r.nivel_risco_inicial === 'Alto').length,
      medios: riscosData.filter(r => r.nivel_risco_inicial === 'Médio').length,
      baixos: riscosData.filter(r => r.nivel_risco_inicial === 'Baixo' || r.nivel_risco_inicial === 'Muito Baixo').length,
      tratamentos_pendentes: 0,
      tratamentos_andamento: 0,
      tratamentos_concluidos: 0,
      aceitos: riscosData.filter(r => r.aceito).length,
      tratados: riscosData.filter(r => r.nivel_risco_residual).length
    };

    try {
      const { data: tratamentos } = await supabase
        .from('riscos_tratamentos')
        .select('status, risco_id')
        .in('risco_id', riscosData.map(r => r.id));

      if (tratamentos) {
        newStats.tratamentos_pendentes = tratamentos.filter(t => t.status === 'pendente').length;
        newStats.tratamentos_andamento = tratamentos.filter(t => t.status === 'em andamento').length;
        newStats.tratamentos_concluidos = tratamentos.filter(t => t.status === 'concluído').length;
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas de tratamentos:', error);
    }

    setStats(newStats);
  };

  useEffect(() => {
    if (profile) {
      fetchRiscos();
      fetchMatrizConfig();
    }
  }, [profile]);

  const filteredRiscos = riscos.filter(risco => {
    const matchesSearch = risco.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         risco.responsavel?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || statusFilter === 'all' || risco.status === statusFilter;
    const matchesNivel = !nivelFilter || nivelFilter === 'all' || risco.nivel_risco_inicial === nivelFilter;

    return matchesSearch && matchesStatus && matchesNivel;
  });

  const handleEdit = (risco: Risco) => {
    setEditingRisco(risco);
    setRiscoDialogOpen(true);
  };

  const openDeleteDialog = (risco: Risco) => {
    setRiscoToDelete(risco);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!riscoToDelete) return;

    try {
      const { error } = await supabase
        .from('riscos')
        .delete()
        .eq('id', riscoToDelete.id);

      if (error) throw error;

      toast.success('Risco excluído com sucesso!');
      setDeleteDialogOpen(false);
      setRiscoToDelete(null);
      fetchRiscos();
    } catch (error: any) {
      toast.error('Erro ao excluir risco: ' + error.message);
    }
  };

  const openCreateDialog = () => {
    setEditingRisco(null);
    setRiscoDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    setRiscoDialogOpen(false);
    setEditingRisco(null);
    fetchRiscos();
  };

  const handleMatrizDialogSuccess = () => {
    setMatrizDialogOpen(false);
    fetchRiscos();
    fetchMatrizConfig();
  };

  const handleCategoriasDialogSuccess = () => {
    setCategoriasDialogOpen(false);
    fetchRiscos();
  };

  const getNivelBadgeVariant = (nivel: string) => {
    if (matrizConfig) {
      const nivelConfig = matrizConfig.niveis_risco.find(n => n.nivel === nivel);
      if (nivelConfig?.cor) {
        return 'default';
      }
    }

    // Fallback para cores padrão se não houver configuração
    switch (nivel) {
      case 'Crítico':
      case 'Muito Alto':
        return 'destructive';
      case 'Alto':
        return 'destructive';
      case 'Médio':
        return 'secondary';
      case 'Baixo':
      case 'Muito Baixo':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getNivelBadgeStyle = (nivel: string) => {
    if (matrizConfig) {
      const nivelConfig = matrizConfig.niveis_risco.find(n => n.nivel === nivel);
      if (nivelConfig?.cor) {
        return {
          backgroundColor: nivelConfig.cor,
          color: 'white',
          borderColor: nivelConfig.cor
        };
      }
    }
    return {};
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'identificado':
        return 'secondary';
      case 'analisado':
        return 'outline';
      case 'tratado':
        return 'default';
      case 'monitorado':
        return 'secondary';
      case 'aceito':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleTratamentosClick = (riscoId: string, riscoNome: string) => {
    setSelectedRiscoForTratamentos(riscoId);
    setActiveTab('tratamentos');
    console.log(`Navegando para tratamentos do risco: ${riscoNome} (ID: ${riscoId})`);
    toast.success(`Visualizando tratamentos do risco: ${riscoNome}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando riscos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Riscos</h1>
            <p className="text-muted-foreground">
              Identifique, avalie e monitore riscos organizacionais de forma estruturada
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Risco
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Riscos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.criticos} críticos, {stats.altos} altos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tratamentos Concluídos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.tratamentos_concluidos}</div>
              <p className="text-xs text-muted-foreground">
                {stats.tratamentos_andamento} em andamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Riscos Aceitos</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.aceitos}</div>
              <p className="text-xs text-muted-foreground">
                Aceitos formalmente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Efetividade</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tratados}</div>
              <p className="text-xs text-muted-foreground">
                Com avaliação residual
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="riscos">Riscos</TabsTrigger>
            <TabsTrigger value="tratamentos">Tratamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="riscos">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Riscos Identificados
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCategoriasDialogOpen(true)}>
                      <Tag className="mr-2 h-4 w-4" />
                      Categorias
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setMatrizDialogOpen(true)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Configurar Matriz
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar riscos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="identificado">Identificado</SelectItem>
                        <SelectItem value="analisado">Analisado</SelectItem>
                        <SelectItem value="tratado">Tratado</SelectItem>
                        <SelectItem value="monitorado">Monitorado</SelectItem>
                        <SelectItem value="aceito">Aceito</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={nivelFilter} onValueChange={setNivelFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Nível" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Crítico">Crítico</SelectItem>
                        <SelectItem value="Alto">Alto</SelectItem>
                        <SelectItem value="Médio">Médio</SelectItem>
                        <SelectItem value="Baixo">Baixo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tabela de Riscos com ícones nos botões */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Nível Inicial</TableHead>
                        <TableHead>Nível Residual</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRiscos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            {searchTerm || statusFilter || nivelFilter
                              ? 'Nenhum risco encontrado com os filtros aplicados.'
                              : 'Nenhum risco cadastrado. Clique em "Novo Risco" para adicionar o primeiro.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRiscos.map((risco) => (
                          <TableRow key={risco.id}>
                            <TableCell className="font-medium">{risco.nome}</TableCell>
                            <TableCell>
                              {risco.categoria && (
                                <div className="flex items-center gap-2">
                                  {risco.categoria.cor && (
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: risco.categoria.cor }}
                                    />
                                  )}
                                  {risco.categoria.nome}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={getNivelBadgeVariant(risco.nivel_risco_inicial)}
                                style={getNivelBadgeStyle(risco.nivel_risco_inicial)}
                              >
                                {risco.nivel_risco_inicial}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {risco.nivel_risco_residual ? (
                                <Badge 
                                  variant={getNivelBadgeVariant(risco.nivel_risco_residual)}
                                  style={getNivelBadgeStyle(risco.nivel_risco_residual)}
                                >
                                  {risco.nivel_risco_residual}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(risco.status)}>
                                {risco.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{risco.responsavel || '-'}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEdit(risco)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar risco</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleTratamentosClick(risco.id, risco.nome)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Ver tratamentos</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openDeleteDialog(risco)}
                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Excluir risco</p>
                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tratamentos">
            {selectedRiscoForTratamentos ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Tratamentos do Risco</h2>
                    <p className="text-muted-foreground">
                      Risco selecionado: {riscos.find(r => r.id === selectedRiscoForTratamentos)?.nome}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedRiscoForTratamentos(null);
                      setActiveTab('riscos');
                    }}
                  >
                    Voltar para Lista de Riscos
                  </Button>
                </div>
                <TratamentosList riscoId={selectedRiscoForTratamentos} />
              </div>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Selecione um Risco</h3>
                    <p className="text-muted-foreground mb-4">
                      Para visualizar e gerenciar tratamentos, primeiro selecione um risco na aba "Riscos".
                    </p>
                    <Button onClick={() => setActiveTab('riscos')}>
                      Ver Lista de Riscos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <RiscoDialog
          open={riscoDialogOpen}
          onOpenChange={setRiscoDialogOpen}
          risco={editingRisco}
          onSuccess={handleDialogSuccess}
        />

        <MatrizDialog
          open={matrizDialogOpen}
          onOpenChange={setMatrizDialogOpen}
          onSuccess={handleMatrizDialogSuccess}
        />

        <CategoriasDialog
          open={categoriasDialogOpen}
          onOpenChange={setCategoriasDialogOpen}
          onSuccess={handleCategoriasDialogSuccess}
        />

        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Excluir Risco"
          description={`Tem certeza que deseja excluir o risco "${riscoToDelete?.nome}"? Esta ação não pode ser desfeita.`}
          onConfirm={handleDelete}
        />
      </div>
    </TooltipProvider>
  );
}
