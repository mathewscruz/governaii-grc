import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, Upload, User, Save, CheckCircle2, XCircle, AlertTriangle, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { EvidenceDialog } from './EvidenceDialog';
import { AssignmentDialog } from './AssignmentDialog';
import { AreaResponsavelInlineSelect } from './AreaResponsavelInlineSelect';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Requirement {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  categoria: string;
  area_responsavel?: string | null;
  peso: number;
  obrigatorio: boolean;
  ordem: number;
}

interface Evaluation {
  id: string;
  requirement_id: string;
  status: 'conforme' | 'nao_conforme' | 'parcialmente_conforme' | 'nao_aplicavel' | 'nao_avaliado';
  observacoes?: string;
  responsavel_id?: string;
  data_avaliacao?: string;
}

interface AssessmentEvaluationViewProps {
  assessmentId: string;
  frameworkId: string;
  frameworkName: string;
  assessmentName: string;
  onSave?: () => void;
}

export const AssessmentEvaluationView = ({
  assessmentId,
  frameworkId,
  frameworkName,
  assessmentName,
  onSave
}: AssessmentEvaluationViewProps) => {
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({});
  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(null);
  const [isEvidenceDialogOpen, setIsEvidenceDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { toast } = useToast();

  const { data: requirementsData, loading: loadingRequirements } = useOptimizedQuery(
    async () => {
      const { data, error } = await supabase
        .from('gap_analysis_requirements')
        .select('*')
        .eq('framework_id', frameworkId)
        .order('categoria, ordem');

      if (error) throw error;
      return { data: data || [], error: null };
    },
    [frameworkId],
    {
      staleTime: 5 * 60 * 1000,
      cacheKey: `gap-requirements-${frameworkId}`
    }
  );

  // Sincronizar com estado local para permitir atualizações dinâmicas
  useEffect(() => {
    if (requirementsData) {
      setRequirements(requirementsData);
    }
  }, [requirementsData]);

  const { data: existingEvaluations, loading: loadingEvaluations } = useOptimizedQuery(
    async () => {
      const { data, error } = await supabase
        .from('gap_analysis_evaluations')
        .select('*')
        .eq('assessment_id', assessmentId);

      if (error) throw error;
      return { data: data || [], error: null };
    },
    [assessmentId],
    {
      staleTime: 2 * 60 * 1000,
      cacheKey: `gap-evaluations-${assessmentId}`
    }
  );

  useEffect(() => {
    if (existingEvaluations) {
      const evaluationsMap: Record<string, Evaluation> = {};
      existingEvaluations.forEach((evaluation: any) => {
        evaluationsMap[evaluation.requirement_id] = evaluation;
      });
      setEvaluations(evaluationsMap);
    }
  }, [existingEvaluations]);

  const handleStatusChange = (requirementId: string, status: string) => {
    setEvaluations(prev => ({
      ...prev,
      [requirementId]: {
        ...prev[requirementId],
        id: prev[requirementId]?.id || '',
        requirement_id: requirementId,
        status: status as any,
        data_avaliacao: new Date().toISOString()
      }
    }));
  };

  const handleAreaChange = (requirementId: string, area: string) => {
    setRequirements(prev => 
      prev.map(req => 
        req.id === requirementId 
          ? { ...req, area_responsavel: area }
          : req
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const evaluationsToSave = Object.values(evaluations).map(evaluation => ({
        assessment_id: assessmentId,
        requirement_id: evaluation.requirement_id,
        status: evaluation.status,
        observacoes: evaluation.observacoes,
        responsavel_id: evaluation.responsavel_id,
        data_avaliacao: evaluation.data_avaliacao
      }));

      // Upsert evaluations
      const { error } = await supabase
        .from('gap_analysis_evaluations')
        .upsert(evaluationsToSave, {
          onConflict: 'assessment_id,requirement_id'
        });

      if (error) throw error;

      toast({
        title: "Avaliação salva",
        description: "Todas as avaliações foram salvas com sucesso.",
      });

      onSave?.();
    } catch (error) {
      console.error('Erro ao salvar avaliações:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as avaliações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'conforme':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'nao_conforme':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'parcialmente_conforme':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'nao_aplicavel':
        return <Minus className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'conforme': 'Conforme',
      'nao_conforme': 'Não Conforme',
      'parcialmente_conforme': 'Parcialmente Conforme',
      'nao_aplicavel': 'Não Aplicável',
      'nao_avaliado': 'Não Avaliado'
    };
    return labels[status as keyof typeof labels] || 'Não Avaliado';
  };

  const calculateProgress = () => {
    if (!requirements) return 0;
    const evaluated = Object.values(evaluations).filter(e => e.status !== 'nao_avaliado').length;
    return (evaluated / requirements.length) * 100;
  };

  const getConformityStats = () => {
    const stats = {
      conforme: 0,
      nao_conforme: 0,
      parcialmente_conforme: 0,
      nao_aplicavel: 0,
      nao_avaliado: 0
    };

    Object.values(evaluations).forEach(evaluation => {
      stats[evaluation.status]++;
    });

    return stats;
  };

  if (loadingRequirements || loadingEvaluations) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = getConformityStats();
  const progress = calculateProgress();

  // Paginação
  const totalItems = requirements?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequirements = requirements?.slice(startIndex, endIndex) || [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.conforme}</div>
                <div className="text-sm text-muted-foreground">Conformes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.nao_conforme}</div>
                <div className="text-sm text-muted-foreground">Não Conformes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.parcialmente_conforme}</div>
                <div className="text-sm text-muted-foreground">Parciais</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.nao_aplicavel}</div>
                <div className="text-sm text-muted-foreground">N/A</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">{stats.nao_avaliado}</div>
                <div className="text-sm text-muted-foreground">Pendentes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.round(progress)}%</div>
                <div className="text-sm text-muted-foreground">Concluído</div>
              </div>
            </div>
            <Progress value={progress} className="w-full" />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Avaliação: {assessmentName}</h2>
              <p className="text-muted-foreground">
                Framework: {frameworkName} • {totalItems} requisitos
              </p>
              {totalPages > 1 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems} requisitos (Página {currentPage} de {totalPages})
                </p>
              )}
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar Avaliação'}
            </Button>
          </div>

          <div className="rounded-lg border overflow-visible">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Requisito</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Área Responsável</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRequirements.map((requirement) => {
                  const evaluation = evaluations[requirement.id];
                  const status = evaluation?.status || 'nao_avaliado';
                  
                  return (
                    <TableRow key={requirement.id}>
                      <TableCell className="font-mono text-sm">
                        {requirement.codigo}
                        {requirement.obrigatorio && (
                          <Badge variant="destructive" className="ml-2 text-xs">REQ</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{requirement.titulo}</div>
                          {requirement.descricao && (
                            <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {requirement.descricao}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{requirement.categoria}</Badge>
                      </TableCell>
                      <TableCell>
                        <AreaResponsavelInlineSelect
                          requirementId={requirement.id}
                          currentArea={requirement.area_responsavel}
                          onAreaChange={(area) => handleAreaChange(requirement.id, area)}
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={status} 
                          onValueChange={(value) => handleStatusChange(requirement.id, value)}
                        >
                          <SelectTrigger className="w-48">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(status)}
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent 
                            className="bg-background border-border shadow-lg"
                            position="popper"
                            side="bottom"
                            align="start"
                            sideOffset={4}
                            style={{ zIndex: 9999 }}
                          >
                            <SelectItem value="conforme">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                Conforme
                              </div>
                            </SelectItem>
                            <SelectItem value="nao_conforme">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                Não Conforme
                              </div>
                            </SelectItem>
                            <SelectItem value="parcialmente_conforme">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                Parcialmente Conforme
                              </div>
                            </SelectItem>
                            <SelectItem value="nao_aplicavel">
                              <div className="flex items-center gap-2">
                                <Minus className="h-4 w-4 text-gray-600" />
                                Não Aplicável
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{requirement.peso}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRequirement(requirement.id);
                              setIsEvidenceDialogOpen(true);
                            }}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRequirement(requirement.id);
                              setIsAssignmentDialogOpen(true);
                            }}
                          >
                            <User className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              </Table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) handlePageChange(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Mostrar apenas algumas páginas próximas
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(page);
                            }}
                            isActive={page === currentPage}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) handlePageChange(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>

      <EvidenceDialog
        open={isEvidenceDialogOpen}
        onOpenChange={setIsEvidenceDialogOpen}
        assessmentId={assessmentId}
        requirementId={selectedRequirement || ''}
      />

      <AssignmentDialog
        open={isAssignmentDialogOpen}
        onOpenChange={setIsAssignmentDialogOpen}
        assessmentId={assessmentId}
        requirementId={selectedRequirement || ''}
      />
    </>
  );
};