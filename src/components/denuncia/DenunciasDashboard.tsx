import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Clock, CheckCircle, Eye, UserCheck, Calendar } from 'lucide-react';
import { DenunciaDialog } from './DenunciaDialog';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent } from '@/components/ui/card';
import { formatDateOnly } from '@/lib/date-utils';
import { getDenunciaStatusColor, getCriticidadeColor, formatStatus } from '@/lib/text-utils';

interface Denuncia {
  id: string;
  protocolo: string;
  titulo: string;
  descricao: string;
  status: string;
  gravidade: string;
  anonima: boolean;
  nome_denunciante?: string;
  email_denunciante?: string;
  created_at: string;
  categoria?: {
    nome: string;
    cor: string;
  };
  responsavel?: {
    nome: string;
  } | null;
}


export function DenunciasDashboard({ itemIdToOpen }: { itemIdToOpen?: string | null }) {
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDenuncia, setSelectedDenuncia] = useState<Denuncia | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [gravidadeFilter, setGravidadeFilter] = useState('todos');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();

  useEffect(() => {
    carregarDenuncias();
  }, []);

  // Detectar se veio com itemIdToOpen
  useEffect(() => {
    if (itemIdToOpen && denuncias.length > 0) {
      const denuncia = denuncias.find(d => d.id === itemIdToOpen);
      if (denuncia) {
        setSelectedDenuncia(denuncia);
        setDialogOpen(true);
      }
    }
  }, [itemIdToOpen, denuncias]);

  const carregarDenuncias = async () => {
    try {
      const { data, error } = await supabase
        .from('denuncias')
        .select(`
          *,
          categoria:denuncias_categorias(nome, cor)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDenuncias(data || []);
    } catch (error) {
      console.error('Erro ao carregar denúncias:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar denúncias",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVisualizarDenuncia = (denuncia: Denuncia) => {
    setSelectedDenuncia(denuncia);
    setDialogOpen(true);
  };

  const handleDenunciaAtualizada = () => {
    carregarDenuncias();
  };

  // Filtrar e ordenar denúncias
  const filteredAndSortedDenuncias = useMemo(() => {
    let filtered = denuncias.filter(denuncia => {
      const matchesSearch = searchTerm === '' || 
        denuncia.protocolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        denuncia.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        denuncia.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        denuncia.nome_denunciante?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'todos' || denuncia.status === statusFilter;
      const matchesGravidade = gravidadeFilter === 'todos' || denuncia.gravidade === gravidadeFilter;

      return matchesSearch && matchesStatus && matchesGravidade;
    });

    // Ordenar
    filtered.sort((a, b) => {
      const aValue = a[sortField as keyof Denuncia];
      const bValue = b[sortField as keyof Denuncia];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [denuncias, searchTerm, statusFilter, gravidadeFilter, sortField, sortDirection]);

  // Configuração das colunas
  const columns = [
    {
      key: 'protocolo',
      label: 'Protocolo',
      sortable: true,
      render: (_: any, denuncia: Denuncia) => (
        <span className="font-mono text-sm">{denuncia.protocolo}</span>
      )
    },
    {
      key: 'titulo',
      label: 'Título',
      sortable: true,
      render: (_: any, denuncia: Denuncia) => (
        <div className="max-w-xs truncate">{denuncia.titulo}</div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: any, denuncia: Denuncia) => (
        <Badge className={`${getDenunciaStatusColor(denuncia.status)} border whitespace-nowrap`}>
          {formatStatus(denuncia.status)}
        </Badge>
      )
    },
    {
      key: 'gravidade',
      label: 'Gravidade',
      sortable: true,
      render: (_: any, denuncia: Denuncia) => (
        <Badge className={`${getCriticidadeColor(denuncia.gravidade)} border whitespace-nowrap`}>
          {formatStatus(denuncia.gravidade)}
        </Badge>
      )
    },
    {
      key: 'categoria',
      label: 'Categoria',
      sortable: true,
      render: (_: any, denuncia: Denuncia) => (
        denuncia.categoria ? (
          <Badge variant="outline" style={{ borderColor: denuncia.categoria.cor }}>
            {denuncia.categoria.nome}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      )
    },
    {
      key: 'denunciante',
      label: 'Denunciante',
      sortable: true,
      render: (_: any, denuncia: Denuncia) => (
        denuncia.anonima ? (
          <Badge variant="secondary">Anônima</Badge>
        ) : (
          denuncia.nome_denunciante || 'Não informado'
        )
      )
    },
    {
      key: 'created_at',
      label: 'Data',
      sortable: true,
      render: (_: any, denuncia: Denuncia) => (
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {formatDateOnly(denuncia.created_at)}
        </div>
      )
    },
    {
      key: 'acoes',
      label: 'Ações',
      render: (_: any, denuncia: Denuncia) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVisualizarDenuncia(denuncia)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
  ];

  // Configuração dos filtros
  const filters = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: 'todos', label: 'Todos os status' },
        { value: 'nova', label: 'Nova' },
        { value: 'em_analise', label: 'Em Análise' },
        { value: 'em_investigacao', label: 'Em Investigação' },
        { value: 'resolvida', label: 'Resolvida' },
        { value: 'arquivada', label: 'Arquivada' },
      ]
    },
    {
      key: 'gravidade',
      label: 'Gravidade',
      value: gravidadeFilter,
      onChange: setGravidadeFilter,
      options: [
        { value: 'todos', label: 'Todas' },
        { value: 'baixa', label: 'Baixa' },
        { value: 'media', label: 'Média' },
        { value: 'alta', label: 'Alta' },
        { value: 'critica', label: 'Crítica' },
      ]
    }
  ];

  return (
    <>
      <Card className="rounded-lg border overflow-hidden">
        <CardContent className="p-0">
          <DataTable
            data={filteredAndSortedDenuncias}
            columns={columns}
            loading={loading}
            searchable
            searchPlaceholder="Buscar por protocolo, título ou conteúdo..."
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
            emptyState={{
              icon: <Shield className="h-8 w-8" />,
              title: searchTerm ? "Nenhuma denúncia encontrada" : "Nenhuma denúncia registrada",
              description: searchTerm 
                ? "Tente ajustar os termos de busca ou limpe os filtros."
                : "Denúncias recebidas aparecerão aqui.",
            }}
            onRefresh={carregarDenuncias}
          />
        </CardContent>
      </Card>

      {/* Dialog de detalhes */}
      {selectedDenuncia && (
        <DenunciaDialog
          denuncia={selectedDenuncia}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onDenunciaAtualizada={handleDenunciaAtualizada}
        />
      )}
    </>
  );
}