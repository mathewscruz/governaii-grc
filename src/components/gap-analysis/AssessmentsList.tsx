import { useState } from 'react';
import { Play, Edit2, Eye, BarChart3, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface AssessmentFromList {
  id: string;
  nome: string;
  descricao: string;
  status: string;
  data_inicio: string;
  data_conclusao_prevista: string;
  data_conclusao: string;
  framework_id: string;
  framework: {
    nome: string;
    tipo: string;
  };
  created_at: string;
}

interface AssessmentsListProps {
  onSelectAssessment: (assessment: AssessmentFromList) => void;
  onEditAssessment: (assessment: AssessmentFromList) => void;
}

export const AssessmentsList = ({ onSelectAssessment, onEditAssessment }: AssessmentsListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: assessments, loading, refetch } = useOptimizedQuery(
    async () => {
      const { data, error } = await supabase
        .from('gap_analysis_assessments')
        .select(`
          *,
          framework:gap_analysis_frameworks(nome, tipo)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    },
    [],
    {
      staleTime: 5 * 60 * 1000,
      cacheKey: 'gap-assessments-list'
    }
  );

  const filteredAssessments = assessments?.filter((assessment: any) => {
    const matchesSearch = assessment.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.framework?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || assessment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      'rascunho': 'secondary',
      'em_andamento': 'default',
      'pausada': 'outline',
      'concluida': 'default',
      'cancelada': 'destructive'
    } as const;

    const labels = {
      'rascunho': 'Rascunho',
      'em_andamento': 'Em Andamento',
      'pausada': 'Pausada',
      'concluida': 'Concluída',
      'cancelada': 'Cancelada'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getFrameworkTypeBadge = (tipo: string) => {
    const colors = {
      'regulatorio': 'bg-blue-100 text-blue-800',
      'normativo': 'bg-green-100 text-green-800',
      'boas_praticas': 'bg-purple-100 text-purple-800',
      'interno': 'bg-orange-100 text-orange-800'
    };

    return (
      <Badge variant="outline" className={colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {tipo}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Avaliações de Gap Analysis
        </CardTitle>
        <CardDescription>
          Gerencie suas avaliações de conformidade e maturidade
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome da avaliação ou framework..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="pausada">Pausada</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredAssessments && filteredAssessments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Avaliação</TableHead>
                <TableHead>Framework</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Datas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssessments.map((assessment: any) => (
                <TableRow key={assessment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{assessment.nome}</div>
                      {assessment.descricao && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {assessment.descricao}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{assessment.framework?.nome}</div>
                      {assessment.framework?.tipo && (
                        <div>{getFrameworkTypeBadge(assessment.framework.tipo)}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(assessment.status)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      {assessment.data_inicio && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Início: {new Date(assessment.data_inicio).toLocaleDateString()}
                        </div>
                      )}
                      {assessment.data_conclusao_prevista && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Prevista: {new Date(assessment.data_conclusao_prevista).toLocaleDateString()}
                        </div>
                      )}
                      {assessment.data_conclusao && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Concluída: {new Date(assessment.data_conclusao).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectAssessment(assessment)}
                        title="Abrir avaliação"
                      >
                        {assessment.status === 'concluida' ? <Eye className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditAssessment(assessment)}
                        title="Editar configurações"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">
              {searchTerm || statusFilter !== 'all' 
                ? 'Nenhuma avaliação encontrada' 
                : 'Nenhuma avaliação criada'}
            </p>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece criando uma nova avaliação para um framework.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};