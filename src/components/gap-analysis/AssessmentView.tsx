import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, Plus, Save } from "lucide-react";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/integrations/supabase/client";
import { RequirementsManagerDialog } from "./RequirementsManagerDialog";
import { EvidenceUpload } from "./EvidenceUpload";
import { toast } from "sonner";
import { Requirement } from "./types";
import { cn } from "@/lib/utils";

interface AssessmentViewProps {
  frameworkId: string;
  frameworkName: string;
}

export const AssessmentView: React.FC<AssessmentViewProps> = ({
  frameworkId,
  frameworkName
}) => {
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [evaluations, setEvaluations] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const debouncedEvaluations = useDebounce(evaluations, 1500);

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
      cacheKey: `gap-requirements-${frameworkId}`,
      cacheDuration: 5,
      staleTime: 2
    }
  ) as { data: Requirement[], loading: boolean, refetch: () => void };

  // Carregar avaliações existentes
  const { data: existingEvaluations } = useOptimizedQuery(
    async () => {
      const { data, error } = await supabase
        .from('gap_analysis_evaluations')
        .select('*')
        .eq('framework_id', frameworkId);

      if (error) throw error;
      return { data: data || [], error: null };
    },
    [frameworkId],
    {
      cacheKey: `gap-evaluations-${frameworkId}`,
      cacheDuration: 2,
      staleTime: 1
    }
  ) as { data: any[], loading: boolean };

  // Inicializar estado com avaliações existentes
  useEffect(() => {
    if (existingEvaluations && Array.isArray(existingEvaluations)) {
      const evaluationsMap: Record<string, any> = {};
      existingEvaluations.forEach((evaluation: any) => {
        evaluationsMap[evaluation.requirement_id] = {
          evidence_implemented: evaluation.evidence_implemented || '',
          responsible_area: evaluation.responsible_area || '',
          conformity_status: evaluation.conformity_status || 'nao_aplicavel',
          action_preview: evaluation.action_preview || '',
          evidence_status: evaluation.evidence_status || 'pendente',
          evidence_files: evaluation.evidence_files || []
        };
      });
      setEvaluations(evaluationsMap);
    }
  }, [existingEvaluations]);

  const handleEvaluationChange = (requirementId: string, field: string, value: any) => {
    setEvaluations(prev => ({
      ...prev,
      [requirementId]: {
        ...prev[requirementId],
        [field]: value
      }
    }));
  };

  // Salvamento automático com debounce
  const saveEvaluations = useCallback(async (evaluationsToSave: Record<string, any>) => {
    if (Object.keys(evaluationsToSave).length === 0) return;
    
    setSaving(true);
    try {
      const evaluationsArray = Object.entries(evaluationsToSave).map(([requirementId, evaluation]) => ({
        requirement_id: requirementId,
        framework_id: frameworkId,
        assessment_id: frameworkId, // Mantendo para compatibilidade
        evidence_implemented: evaluation.evidence_implemented || '',
        responsible_area: evaluation.responsible_area || '',
        conformity_status: evaluation.conformity_status || 'nao_aplicavel',
        action_preview: evaluation.action_preview || '',
        evidence_status: evaluation.evidence_status || 'pendente',
        evidence_files: evaluation.evidence_files || []
      }));

      const { error } = await supabase
        .from('gap_analysis_evaluations')
        .upsert(evaluationsArray, {
          onConflict: 'framework_id,requirement_id'
        });

      if (error) throw error;
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  }, [frameworkId]);

  // Efeito para salvamento automático
  useEffect(() => {
    if (Object.keys(debouncedEvaluations).length > 0) {
      saveEvaluations(debouncedEvaluations);
    }
  }, [debouncedEvaluations, saveEvaluations]);

  const handleSaveEvaluations = async () => {
    await saveEvaluations(evaluations);
    toast.success("Avaliações salvas com sucesso!");
  };

  const handleManagerSuccess = () => {
    refetch();
    setIsManagerOpen(false);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="h-32 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Avaliação: {frameworkName}
                {saving && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Save className="h-4 w-4 mr-1 animate-pulse" />
                    Salvando...
                  </div>
                )}
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsManagerOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Gerenciar Requisitos
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {requirements.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Nenhum requisito encontrado para este framework.
            </p>
            <Button onClick={() => setIsManagerOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Requisito
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Código/Requisito</TableHead>
                    <TableHead className="w-[120px]">Evidência Implementada</TableHead>
                    <TableHead className="w-[120px]">Área Responsável</TableHead>
                    <TableHead className="w-[120px]">Conformidade</TableHead>
                    <TableHead className="w-[150px]">Prévia das Ações / Observações</TableHead>
                    <TableHead className="w-[120px]">Status da Evidência</TableHead>
                    <TableHead className="w-[140px]">Evidências</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requirements.map((requirement) => (
                    <TableRow key={requirement.id}>
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          {requirement.codigo && (
                            <span className="text-xs text-muted-foreground block">
                              {requirement.codigo}
                            </span>
                          )}
                          <div className="text-sm font-medium">{requirement.titulo}</div>
                          {requirement.obrigatorio && (
                            <Badge variant="destructive" className="text-xs">
                              Obrigatório
                            </Badge>
                          )}
                          {requirement.categoria && (
                            <Badge variant="secondary" className="text-xs">
                              {requirement.categoria}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Textarea
                          placeholder="Evidência implementada..."
                          value={evaluations[requirement.id]?.evidence_implemented || ""}
                          onChange={(e) => handleEvaluationChange(requirement.id, 'evidence_implemented', e.target.value)}
                          className="min-h-[60px] text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Área responsável..."
                          value={evaluations[requirement.id]?.responsible_area || ""}
                          onChange={(e) => handleEvaluationChange(requirement.id, 'responsible_area', e.target.value)}
                          className="text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={evaluations[requirement.id]?.conformity_status || "nao_aplicavel"}
                          onValueChange={(value) => handleEvaluationChange(requirement.id, 'conformity_status', value)}
                        >
                          <SelectTrigger className={cn(
                            "text-xs",
                            evaluations[requirement.id]?.conformity_status === 'conforme' && "border-green-500 bg-green-50 text-green-700",
                            evaluations[requirement.id]?.conformity_status === 'nao_conforme' && "border-red-500 bg-red-50 text-red-700",
                            evaluations[requirement.id]?.conformity_status === 'parcial' && "border-yellow-500 bg-yellow-50 text-yellow-700",
                            evaluations[requirement.id]?.conformity_status === 'nao_aplicavel' && "border-gray-300 bg-gray-50 text-gray-600"
                          )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="conforme" className="text-green-700">✓ Conforme</SelectItem>
                            <SelectItem value="nao_conforme" className="text-red-700">✗ Não conforme</SelectItem>
                            <SelectItem value="parcial" className="text-yellow-700">◐ Parcial</SelectItem>
                            <SelectItem value="nao_aplicavel" className="text-gray-600">− Não aplicável</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Textarea
                          placeholder="Ações/Observações..."
                          value={evaluations[requirement.id]?.action_preview || ""}
                          onChange={(e) => handleEvaluationChange(requirement.id, 'action_preview', e.target.value)}
                          className="min-h-[60px] text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={evaluations[requirement.id]?.evidence_status || "pendente"}
                          onValueChange={(value) => handleEvaluationChange(requirement.id, 'evidence_status', value)}
                        >
                          <SelectTrigger className={cn(
                            "text-xs",
                            evaluations[requirement.id]?.evidence_status === 'aprovada' && "border-green-500 bg-green-50 text-green-700",
                            evaluations[requirement.id]?.evidence_status === 'rejeitada' && "border-red-500 bg-red-50 text-red-700",
                            evaluations[requirement.id]?.evidence_status === 'em_analise' && "border-orange-500 bg-orange-50 text-orange-700",
                            evaluations[requirement.id]?.evidence_status === 'pendente' && "border-blue-300 bg-blue-50 text-blue-600"
                          )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente" className="text-blue-600">⏳ Pendente</SelectItem>
                            <SelectItem value="em_analise" className="text-orange-700">🔍 Em análise</SelectItem>
                            <SelectItem value="aprovada" className="text-green-700">✓ Aprovada</SelectItem>
                            <SelectItem value="rejeitada" className="text-red-700">✗ Rejeitada</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <EvidenceUpload
                          requirementId={requirement.id}
                          frameworkId={frameworkId}
                          evidenceFiles={evaluations[requirement.id]?.evidence_files || []}
                          onFilesUpdate={(files) => handleEvaluationChange(requirement.id, 'evidence_files', files)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {requirements.length > 0 && (
            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveEvaluations}>
                Salvar Avaliações
              </Button>
            </div>
          )}
        </div>
      )}

      <RequirementsManagerDialog
        open={isManagerOpen}
        onOpenChange={setIsManagerOpen}
        frameworkId={frameworkId}
        frameworkName={frameworkName}
        onSuccess={handleManagerSuccess}
      />
    </div>
  );
};