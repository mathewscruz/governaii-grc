import { useState } from 'react';
import { Plus, Edit2, Trash2, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { RequirementDialog } from './RequirementDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';

interface Requirement {
  id: string;
  framework_id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  categoria: string;
  peso: number;
  obrigatorio: boolean;
  referencia_externa?: string;
  ordem: number;
  created_at: string;
}

interface RequirementsManagerProps {
  frameworkId: string;
  frameworkName: string;
}

export const RequirementsManager = ({ frameworkId, frameworkName }: RequirementsManagerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const { toast } = useToast();

  const { data: requirements, loading, refetch } = useOptimizedQuery(
    async () => {
      const { data, error } = await supabase
        .from('gap_analysis_requirements')
        .select('*')
        .eq('framework_id', frameworkId)
        .order('codigo');

      if (error) throw error;
      return { data: data || [], error: null };
    },
    [frameworkId],
    {
      staleTime: 2 * 60 * 1000,
      cacheKey: `gap-requirements-${frameworkId}`
    }
  );

  const handleEdit = (requirement: Requirement) => {
    setSelectedRequirement(requirement);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedRequirement(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (requirementId: string) => {
    try {
      const { error } = await supabase
        .from('gap_analysis_requirements')
        .delete()
        .eq('id', requirementId);

      if (error) throw error;

      toast({
        title: "Requisito excluído",
        description: "O requisito foi excluído com sucesso.",
      });

      refetch();
    } catch (error) {
      logger.error('Erro ao excluir requisito:', { error: error instanceof Error ? error.message : String(error) });
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o requisito.",
        variant: "destructive",
      });
    }
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setSelectedRequirement(null);
    refetch();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Requisitos do Framework
              </CardTitle>
              <CardDescription>
                Gerencie os requisitos do framework "{frameworkName}"
              </CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Requisito
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {requirements && requirements.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Obrigatório</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requirements.map((requirement) => (
                  <TableRow key={requirement.id}>
                    <TableCell className="font-mono text-sm">
                      {requirement.codigo}
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
                    <TableCell>{requirement.peso}</TableCell>
                    <TableCell>
                      <Badge variant={requirement.obrigatorio ? "default" : "outline"}>
                        {requirement.obrigatorio ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(requirement)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(requirement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum requisito cadastrado</p>
              <p className="text-muted-foreground mb-4">
                Comece adicionando requisitos para este framework.
              </p>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Requisito
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <RequirementDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        frameworkId={frameworkId}
        requirement={selectedRequirement}
        onSuccess={handleSuccess}
      />
    </>
  );
};