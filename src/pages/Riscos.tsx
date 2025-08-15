import { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, TrendingUp, CheckCircle, Shield, Settings, Tag, Edit, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useRiscosStats } from '@/hooks/useRiscosStats';
import { useToast } from '@/hooks/use-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { RiscoDialog } from '@/components/riscos/RiscoDialog';
import { MatrizDialog } from '@/components/riscos/MatrizDialog';
import { CategoriasDialog } from '@/components/riscos/CategoriasDialog';
import { RiscoAnexosIcone } from '@/components/riscos/RiscoAnexosIcone';

interface Risco {
  id: string;
  nome: string;
  descricao?: string;
  matriz_id?: string;
  categoria_id?: string;
  probabilidade_inicial?: string;
  impacto_inicial?: string;
  probabilidade_residual?: string;
  impacto_residual?: string;
  nivel_risco_inicial: string;
  nivel_risco_residual?: string;
  status: string;
  responsavel?: string;
  controles_existentes?: string;
  causas?: string;
  consequencias?: string;
  aceito: boolean;
  justificativa_aceite?: string;
  categoria?: { nome: string; cor?: string };
  matriz?: { nome: string };
  created_at: string;
}


interface MatrizConfig {
  niveis_risco: Array<{ min: number; max: number; nivel: string; cor?: string }>;
}

export function Riscos() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { data: stats, refetch: refetchStats } = useRiscosStats();
  const [riscos, setRiscos] = useState<Risco[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [nivelFilter, setNivelFilter] = useState<string>('');
  const [aceitoFilter, setAceitoFilter] = useState<string>('');
  const [riscoDialogOpen, setRiscoDialogOpen] = useState(false);
  const [matrizDialogOpen, setMatrizDialogOpen] = useState(false);
  const [editingRisco, setEditingRisco] = useState<Risco | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [riscoToDelete, setRiscoToDelete] = useState<Risco | null>(null);
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
          matriz_id,
          categoria_id,
          probabilidade_inicial,
          impacto_inicial,
          probabilidade_residual,
          impacto_residual,
          nivel_risco_inicial,
          nivel_risco_residual,
          status,
          responsavel,
          controles_existentes,
          causas,
          consequencias,
          aceito,
          justificativa_aceite,
          created_at,
          categoria:riscos_categorias(nome, cor),
          matriz:riscos_matrizes(nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Riscos carregados:', data);
      setRiscos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar riscos: " + error.message,
        variant: "destructive",
      });
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
    const matchesAceito = !aceitoFilter || aceitoFilter === 'all' || 
                         (aceitoFilter === 'aceito' && risco.aceito) ||
                         (aceitoFilter === 'nao_aceito' && !risco.aceito);

    return matchesSearch && matchesStatus && matchesNivel && matchesAceito;
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

      toast({
        title: "Sucesso",
        description: "Risco excluído com sucesso!",
      });
      setDeleteDialogOpen(false);
      setRiscoToDelete(null);
      fetchRiscos();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao excluir risco: " + error.message,
        variant: "destructive",
      });
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
    refetchStats();
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

  const riscoColumns = [
    {
      key: 'nome',
      label: 'Nome',
      sortable: true,
      render: (value: string) => <span className="font-medium">{value}</span>
    },
    {
      key: 'categoria',
      label: 'Categoria',
      render: (value: any) => value ? (
        <div className="flex items-center gap-2">
          {value.cor && (
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: value.cor }}
            />
          )}
          <span className="text-sm">{value.nome}</span>
        </div>
      ) : '-'
    },
    {
      key: 'nivel_risco_inicial',
      label: 'Nível Inicial',
      render: (value: string) => (
        <Badge 
          variant={getNivelBadgeVariant(value)}
          style={getNivelBadgeStyle(value)}
        >
          {value}
        </Badge>
      )
    },
    {
      key: 'nivel_risco_residual',
      label: 'Nível Residual',
      render: (value: string) => value ? (
        <Badge 
          variant={getNivelBadgeVariant(value)}
          style={getNivelBadgeStyle(value)}
        >
          {value}
        </Badge>
      ) : <Badge variant="outline">Não avaliado</Badge>
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <Badge variant={getStatusBadgeVariant(value)}>
          {value}
        </Badge>
      )
    },
    {
      key: 'responsavel',
      label: 'Responsável',
      render: (value: string) => value || '-'
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (value: any, risco: Risco) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(risco)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDeleteDialog(risco)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const filters = [
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'identificado', label: 'Identificado' },
        { value: 'analisado', label: 'Analisado' },
        { value: 'tratado', label: 'Tratado' },
        { value: 'monitorado', label: 'Monitorado' },
        { value: 'aceito', label: 'Aceito' }
      ],
      value: statusFilter,
      onChange: setStatusFilter
    },
    {
      key: 'nivel',
      label: 'Nível',
      type: 'select' as const,
      options: [
        { value: 'Crítico', label: 'Crítico' },
        { value: 'Alto', label: 'Alto' },
        { value: 'Médio', label: 'Médio' },
        { value: 'Baixo', label: 'Baixo' }
      ],
      value: nivelFilter,
      onChange: setNivelFilter
    },
    {
      key: 'aceito',
      label: 'Aceito',
      type: 'select' as const,
      options: [
        { value: 'aceito', label: 'Aceitos' },
        { value: 'nao_aceito', label: 'Não Aceitos' }
      ],
      value: aceitoFilter,
      onChange: setAceitoFilter
    }
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <PageHeader
          title="Gestão de Riscos"
          description="Identifique, avalie e monitore riscos organizacionais de forma estruturada"
          actions={
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Risco
            </Button>
          }
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Riscos"
            value={stats?.total || 0}
            description={`${stats?.criticos || 0} críticos, ${stats?.altos || 0} altos`}
            icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
            variant={stats?.criticos ? "destructive" : "default"}
            loading={!stats}
          />

          <StatCard
            title="Tratamentos Concluídos"
            value={stats?.tratamentos_concluidos || 0}
            description={`${stats?.tratamentos_andamento || 0} em andamento`}
            icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            variant="success"
            loading={!stats}
          />

          <StatCard
            title="Riscos Aceitos"
            value={stats?.aceitos || 0}
            description="Aceitos formalmente"
            icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
            variant="warning"
            loading={!stats}
          />

          <StatCard
            title="Efetividade"
            value={stats?.tratados || 0}
            description="Com avaliação residual"
            icon={<Shield className="h-4 w-4 text-muted-foreground" />}
            variant="info"
            loading={!stats}
          />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Riscos Identificados
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCategoriasDialogOpen(true)} className="whitespace-nowrap">
                <Tag className="mr-2 h-4 w-4" />
                Categorias
              </Button>
              <Button variant="outline" size="sm" onClick={() => setMatrizDialogOpen(true)} className="whitespace-nowrap">
                <Settings className="mr-2 h-4 w-4" />
                Matriz
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={filteredRiscos}
              columns={riscoColumns}
              loading={loading}
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Buscar riscos..."
              filters={filters}
              emptyState={{
                icon: <AlertTriangle className="h-8 w-8" />,
                title: searchTerm || statusFilter !== '' || nivelFilter !== '' || aceitoFilter !== ''
                  ? 'Nenhum risco encontrado'
                  : 'Nenhum risco cadastrado',
                description: searchTerm || statusFilter !== '' || nivelFilter !== '' || aceitoFilter !== ''
                  ? 'Tente ajustar os filtros para encontrar o que procura.'
                  : 'Comece identificando e cadastrando os riscos da sua organização.',
                action: !searchTerm && statusFilter === '' && nivelFilter === '' && aceitoFilter === '' ? {
                  label: 'Cadastrar Primeiro Risco',
                  onClick: openCreateDialog
                } : undefined
              }}
            />
          </CardContent>
        </Card>
        
        {/* Dialogs */}

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
