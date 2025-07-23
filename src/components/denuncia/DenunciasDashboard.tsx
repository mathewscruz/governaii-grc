import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  CheckCircle, 
  Search, 
  Filter,
  Eye,
  UserCheck,
  Calendar
} from 'lucide-react';
import { DenunciaDialog } from './DenunciaDialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  };
}

const statusMap = {
  nova: { label: 'Nova', color: 'bg-blue-500' },
  em_analise: { label: 'Em Análise', color: 'bg-yellow-500' },
  em_investigacao: { label: 'Em Investigação', color: 'bg-orange-500' },
  resolvida: { label: 'Resolvida', color: 'bg-green-500' },
  arquivada: { label: 'Arquivada', color: 'bg-gray-500' }
};

const gravidadeMap = {
  baixa: { label: 'Baixa', color: 'bg-green-100 text-green-800' },
  media: { label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  critica: { label: 'Crítica', color: 'bg-red-100 text-red-800' }
};

export function DenunciasDashboard() {
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [filteredDenuncias, setFilteredDenuncias] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDenuncia, setSelectedDenuncia] = useState<Denuncia | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gravidadeFilter, setGravidadeFilter] = useState('all');
  const { toast } = useToast();

  // Estados para métricas
  const [metricas, setMetricas] = useState({
    total: 0,
    novas: 0,
    em_andamento: 0,
    resolvidas: 0
  });

  useEffect(() => {
    carregarDenuncias();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [denuncias, searchTerm, statusFilter, gravidadeFilter]);

  const carregarDenuncias = async () => {
    try {
      const { data, error } = await supabase
        .from('denuncias')
        .select(`
          *,
          categoria:denuncias_categorias(nome, cor),
          responsavel:profiles(nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDenuncias(data || []);
      calcularMetricas(data || []);
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

  const calcularMetricas = (data: Denuncia[]) => {
    const total = data.length;
    const novas = data.filter(d => d.status === 'nova').length;
    const em_andamento = data.filter(d => ['em_analise', 'em_investigacao'].includes(d.status)).length;
    const resolvidas = data.filter(d => ['resolvida', 'arquivada'].includes(d.status)).length;

    setMetricas({ total, novas, em_andamento, resolvidas });
  };

  const aplicarFiltros = () => {
    let filtered = denuncias;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.protocolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.nome_denunciante?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    // Filtro por gravidade
    if (gravidadeFilter !== 'all') {
      filtered = filtered.filter(d => d.gravidade === gravidadeFilter);
    }

    setFilteredDenuncias(filtered);
  };

  const handleVisualizarDenuncia = (denuncia: Denuncia) => {
    setSelectedDenuncia(denuncia);
    setDialogOpen(true);
  };

  const handleDenunciaAtualizada = () => {
    carregarDenuncias();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.total}</div>
            <p className="text-xs text-muted-foreground">
              Denúncias registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metricas.novas}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando análise
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metricas.em_andamento}</div>
            <p className="text-xs text-muted-foreground">
              Sendo investigadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metricas.resolvidas}</div>
            <p className="text-xs text-muted-foreground">
              Concluídas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Denúncias Recebidas</CardTitle>
          <CardDescription>
            Gerencie e acompanhe todas as denúncias recebidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por protocolo, título ou conteúdo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="nova">Nova</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="em_investigacao">Em Investigação</SelectItem>
                <SelectItem value="resolvida">Resolvida</SelectItem>
                <SelectItem value="arquivada">Arquivada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={gravidadeFilter} onValueChange={setGravidadeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Gravidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gravidade</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Denunciante</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDenuncias.map((denuncia) => (
                  <TableRow key={denuncia.id}>
                    <TableCell className="font-mono text-sm">
                      {denuncia.protocolo}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {denuncia.titulo}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={statusMap[denuncia.status as keyof typeof statusMap]?.color + " text-white"}
                      >
                        {statusMap[denuncia.status as keyof typeof statusMap]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={gravidadeMap[denuncia.gravidade as keyof typeof gravidadeMap]?.color}
                      >
                        {gravidadeMap[denuncia.gravidade as keyof typeof gravidadeMap]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {denuncia.categoria ? (
                        <Badge variant="outline" style={{ borderColor: denuncia.categoria.cor }}>
                          {denuncia.categoria.nome}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {denuncia.anonima ? (
                        <Badge variant="secondary">Anônima</Badge>
                      ) : (
                        denuncia.nome_denunciante || 'Não informado'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(denuncia.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVisualizarDenuncia(denuncia)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredDenuncias.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma denúncia encontrada
              </div>
            )}
          </div>
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
    </div>
  );
}