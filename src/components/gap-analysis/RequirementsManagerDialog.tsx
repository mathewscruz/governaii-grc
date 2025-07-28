import React, { useState } from "react";
import { Plus, Edit, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { supabase } from "@/integrations/supabase/client";
import { RequirementDialog } from "./RequirementDialog";
import { toast } from "sonner";
import { Requirement } from "./types";

interface RequirementsManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  frameworkId: string;
  frameworkName: string;
  onSuccess: () => void;
}

export const RequirementsManagerDialog: React.FC<RequirementsManagerDialogProps> = ({
  open,
  onOpenChange,
  frameworkId,
  frameworkName,
  onSuccess
}) => {
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [isRequirementDialogOpen, setIsRequirementDialogOpen] = useState(false);

  const { data: requirements = [], loading, refetch } = useOptimizedQuery(
    async () => {
      const { data, error } = await supabase
        .from('gap_analysis_requirements')
        .select('*')
        .eq('framework_id', frameworkId)
        .order('ordem', { ascending: true });

      if (error) throw error;
      return { data: data || [], error: null };
    },
    [frameworkId],
    {
      cacheKey: `gap-requirements-manager-${frameworkId}`,
      cacheDuration: 0.5,
      staleTime: 0.1
    }
  ) as { data: Requirement[], loading: boolean, refetch: () => void };

  const handleEdit = (requirement: Requirement) => {
    setSelectedRequirement(requirement);
    setIsRequirementDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedRequirement(null);
    setIsRequirementDialogOpen(true);
  };

  const handleDelete = async (requirement: Requirement) => {
    if (!confirm(`Tem certeza que deseja excluir o requisito "${requirement.titulo}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('gap_analysis_requirements')
        .delete()
        .eq('id', requirement.id);

      if (error) throw error;

      refetch();
    } catch (error: any) {
      toast.error("Erro ao excluir requisito: " + error.message);
    }
  };

  const handleRequirementSuccess = () => {
    refetch();
    setIsRequirementDialogOpen(false);
    onSuccess();
  };

  const handleMoveUp = async (requirement: Requirement) => {
    const currentIndex = requirements.findIndex(r => r.id === requirement.id);
    if (currentIndex <= 0) return;

    const previousRequirement = requirements[currentIndex - 1];
    
    try {
      // Trocar as ordens
      const { error: error1 } = await supabase
        .from('gap_analysis_requirements')
        .update({ ordem: previousRequirement.ordem })
        .eq('id', requirement.id);

      const { error: error2 } = await supabase
        .from('gap_analysis_requirements')
        .update({ ordem: requirement.ordem })
        .eq('id', previousRequirement.id);

      if (error1 || error2) throw error1 || error2;

      refetch();
    } catch (error: any) {
      toast.error("Erro ao alterar ordem: " + error.message);
    }
  };

  const handleMoveDown = async (requirement: Requirement) => {
    const currentIndex = requirements.findIndex(r => r.id === requirement.id);
    if (currentIndex >= requirements.length - 1) return;

    const nextRequirement = requirements[currentIndex + 1];
    
    try {
      // Trocar as ordens
      const { error: error1 } = await supabase
        .from('gap_analysis_requirements')
        .update({ ordem: nextRequirement.ordem })
        .eq('id', requirement.id);

      const { error: error2 } = await supabase
        .from('gap_analysis_requirements')
        .update({ ordem: requirement.ordem })
        .eq('id', nextRequirement.id);

      if (error1 || error2) throw error1 || error2;

      refetch();
    } catch (error: any) {
      toast.error("Erro ao alterar ordem: " + error.message);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Requisitos - {frameworkName}</DialogTitle>
          </DialogHeader>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Gerenciar Requisitos - {frameworkName}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center flex-shrink-0">
              <p className="text-sm text-muted-foreground">
                Gerencie os requisitos deste framework. Estes requisitos serão utilizados para criar avaliações de conformidade.
              </p>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Requisito
              </Button>
            </div>

            {requirements.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Nenhum requisito encontrado</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Este framework ainda não possui requisitos.
                  </p>
                  <Button onClick={handleAdd}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Requisito
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="flex-1 overflow-hidden flex flex-col">
                <ScrollArea className="h-[500px]">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Ordem</TableHead>
                        <TableHead className="w-24">Código</TableHead>
                        <TableHead className="min-w-[200px]">Título</TableHead>
                        <TableHead className="w-32">Categoria</TableHead>
                        <TableHead className="w-32">Área Responsável</TableHead>
                        <TableHead className="w-16">Peso</TableHead>
                        <TableHead className="w-24">Obrigatório</TableHead>
                        <TableHead className="w-20">Ações</TableHead>
                      </TableRow>
                      </TableHeader>
                      <TableBody>
                      {requirements.map((requirement, index) => (
                        <TableRow key={requirement.id}>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline">{requirement.ordem || index + 1}</Badge>
                              <div className="flex flex-col">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleMoveUp(requirement)}
                                  disabled={index === 0}
                                  className="h-5 w-5 p-0"
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleMoveDown(requirement)}
                                  disabled={index === requirements.length - 1}
                                  className="h-5 w-5 p-0"
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {requirement.codigo || '-'}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{requirement.titulo}</div>
                              {requirement.descricao && (
                                <div className="text-sm text-muted-foreground truncate max-w-xs">
                                  {requirement.descricao}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {requirement.categoria && (
                              <Badge variant="secondary">
                                {requirement.categoria}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {requirement.area_responsavel && (
                              <Badge variant="outline">
                                {requirement.area_responsavel}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {requirement.peso && (
                              <Badge variant="outline">
                                {requirement.peso}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {requirement.obrigatorio ? (
                              <Badge variant="destructive">Sim</Badge>
                            ) : (
                              <Badge variant="secondary">Não</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(requirement)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(requirement)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <RequirementDialog
        open={isRequirementDialogOpen}
        onOpenChange={setIsRequirementDialogOpen}
        onSuccess={handleRequirementSuccess}
        frameworkId={frameworkId}
        requirement={selectedRequirement}
      />
    </>
  );
};