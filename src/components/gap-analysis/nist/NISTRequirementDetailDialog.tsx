import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { Loader2, Upload, X, FileText, Calendar, Lightbulb, ClipboardList, CheckCircle2, ExternalLink, AlertTriangle } from "lucide-react";
import { formatDateForInput, parseDateForDB } from "@/lib/date-utils";
import { PlanoAcaoDialog } from "@/components/planos-acao/PlanoAcaoDialog";

interface NISTRequirement {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string | null;
  categoria: string;
  area_responsavel: string | null;
  peso: number;
  conformity_status?: string | null;
  evaluation_id?: string | null;
  orientacao_implementacao?: string | null;
  exemplos_evidencias?: string | null;
  obrigatorio?: boolean | null;
}

interface NISTRequirementDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirement: NISTRequirement;
  frameworkId: string;
  onClose: () => void;
}

interface User {
  user_id: string;
  nome: string;
  email: string;
}

interface Risco {
  id: string;
  nome: string;
  nivel_risco_inicial: string;
}

interface EvaluationData {
  id?: string;
  responsavel_avaliacao: string;
  plano_acao: string;
  observacoes: string;
  prazo_implementacao: string;
  riscos_vinculados: string[];
  evidence_files: any[];
  plano_acao_id?: string | null;
}

export const NISTRequirementDetailDialog: React.FC<NISTRequirementDetailDialogProps> = ({
  open,
  onOpenChange,
  requirement,
  frameworkId,
  onClose
}) => {
  const { empresaId } = useEmpresaId();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [riscos, setRiscos] = useState<Risco[]>([]);
  const [uploading, setUploading] = useState(false);
  const [planoAcaoDialogOpen, setPlanoAcaoDialogOpen] = useState(false);
  const [planoAcaoVinculado, setPlanoAcaoVinculado] = useState<any>(null);
  const [savingPlano, setSavingPlano] = useState(false);
  const [requirementDetails, setRequirementDetails] = useState<{ orientacao_implementacao?: string | null; exemplos_evidencias?: string | null }>({});

  const [formData, setFormData] = useState<EvaluationData>({
    responsavel_avaliacao: '',
    plano_acao: '',
    observacoes: '',
    prazo_implementacao: '',
    riscos_vinculados: [],
    evidence_files: [],
    plano_acao_id: null
  });

  useEffect(() => {
    if (open && empresaId) {
      loadData();
    }
  }, [open, empresaId, requirement.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar dados em paralelo
      const [usersRes, riscosRes, reqDetailsRes] = await Promise.all([
        supabase.from('profiles').select('user_id, nome, email').eq('empresa_id', empresaId).order('nome'),
        supabase.from('riscos').select('id, nome, nivel_risco_inicial').eq('empresa_id', empresaId).order('nome'),
        supabase.from('gap_analysis_requirements').select('orientacao_implementacao, exemplos_evidencias').eq('id', requirement.id).single()
      ]);

      if (usersRes.error) throw usersRes.error;
      if (riscosRes.error) throw riscosRes.error;

      setUsers(usersRes.data || []);
      setRiscos(riscosRes.data || []);
      setRequirementDetails(reqDetailsRes.data || {});

      // Carregar avaliação existente
      if (requirement.evaluation_id) {
        const { data: evalData, error: evalError } = await supabase
          .from('gap_analysis_evaluations')
          .select('*')
          .eq('id', requirement.evaluation_id)
          .single();

        if (evalError) throw evalError;

        const { data: linkedRiscos } = await supabase
          .from('gap_evaluation_risks')
          .select('risco_id')
          .eq('evaluation_id', requirement.evaluation_id);

        // Carregar plano de ação vinculado
        if (evalData.plano_acao_id) {
          const { data: planoData } = await supabase
            .from('planos_acao')
            .select('id, titulo, status, prioridade, prazo')
            .eq('id', evalData.plano_acao_id)
            .single();
          setPlanoAcaoVinculado(planoData);
        } else {
          setPlanoAcaoVinculado(null);
        }

        setFormData({
          id: evalData.id,
          responsavel_avaliacao: evalData.responsavel_avaliacao || '',
          plano_acao: evalData.plano_acao || '',
          observacoes: evalData.observacoes || '',
          prazo_implementacao: evalData.prazo_implementacao ? formatDateForInput(evalData.prazo_implementacao) : '',
          riscos_vinculados: linkedRiscos?.map(r => r.risco_id) || [],
          evidence_files: Array.isArray(evalData.evidence_files) ? evalData.evidence_files : [],
          plano_acao_id: evalData.plano_acao_id || null
        });
      } else {
        setPlanoAcaoVinculado(null);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedFiles = [];
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `gap-analysis/${empresaId}/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('documentos').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(filePath);
        uploadedFiles.push({ name: file.name, url: publicUrl, size: file.size, type: file.type });
      }
      setFormData(prev => ({ ...prev, evidence_files: [...prev.evidence_files, ...uploadedFiles] }));
      toast.success(`${uploadedFiles.length} arquivo(s) anexado(s)`);
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast.error('Erro ao fazer upload de arquivos');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFormData(prev => ({ ...prev, evidence_files: prev.evidence_files.filter((_, i) => i !== index) }));
  };

  const handleToggleRisco = (riscoId: string) => {
    setFormData(prev => ({
      ...prev,
      riscos_vinculados: prev.riscos_vinculados.includes(riscoId)
        ? prev.riscos_vinculados.filter(id => id !== riscoId)
        : [...prev.riscos_vinculados, riscoId]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let evaluationId = formData.id || requirement.evaluation_id;

      if (evaluationId) {
        const { error: updateError } = await supabase
          .from('gap_analysis_evaluations')
          .update({
            responsavel_avaliacao: formData.responsavel_avaliacao || null,
            plano_acao: formData.plano_acao || null,
            observacoes: formData.observacoes || null,
            prazo_implementacao: formData.prazo_implementacao ? parseDateForDB(formData.prazo_implementacao) : null,
            evidence_files: formData.evidence_files,
            plano_acao_id: formData.plano_acao_id || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', evaluationId);
        if (updateError) throw updateError;
      } else {
        const { data: newEval, error: insertError } = await supabase
          .from('gap_analysis_evaluations')
          .insert({
            framework_id: frameworkId,
            requirement_id: requirement.id,
            empresa_id: empresaId,
            responsavel_avaliacao: formData.responsavel_avaliacao || null,
            plano_acao: formData.plano_acao || null,
            observacoes: formData.observacoes || null,
            prazo_implementacao: formData.prazo_implementacao ? parseDateForDB(formData.prazo_implementacao) : null,
            evidence_files: formData.evidence_files,
            plano_acao_id: formData.plano_acao_id || null,
            conformity_status: requirement.conformity_status || 'pendente',
            evidence_status: 'pendente',
            status: 'em_andamento'
          })
          .select()
          .single();
        if (insertError) throw insertError;
        evaluationId = newEval.id;
      }

      // Atualizar riscos vinculados
      await supabase.from('gap_evaluation_risks').delete().eq('evaluation_id', evaluationId);
      if (formData.riscos_vinculados.length > 0) {
        const { error: riscoError } = await supabase
          .from('gap_evaluation_risks')
          .insert(formData.riscos_vinculados.map(riscoId => ({ evaluation_id: evaluationId, risco_id: riscoId })));
        if (riscoError) throw riscoError;
      }

      toast.success('Detalhes salvos com sucesso');
      onClose();
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error('Erro ao salvar detalhes');
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePlanoAcao = () => {
    setPlanoAcaoDialogOpen(true);
  };

  const handleSavePlanoAcao = async (planoData: any) => {
    setSavingPlano(true);
    try {
      const { data: newPlano, error } = await supabase
        .from('planos_acao')
        .insert({
          ...planoData,
          empresa_id: empresaId,
          modulo_origem: 'frameworks',
          registro_origem_titulo: `${requirement.codigo} - ${requirement.titulo}`,
        })
        .select()
        .single();

      if (error) throw error;

      // Vincular ao evaluation
      setFormData(prev => ({ ...prev, plano_acao_id: newPlano.id }));
      setPlanoAcaoVinculado(newPlano);
      setPlanoAcaoDialogOpen(false);
      toast.success('Plano de ação criado e vinculado');
    } catch (error: any) {
      console.error('Error creating plano:', error);
      toast.error('Erro ao criar plano de ação');
    } finally {
      setSavingPlano(false);
    }
  };

  const getStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'conforme': return <Badge variant="success">Conforme</Badge>;
      case 'parcial': return <Badge variant="warning">Parcial</Badge>;
      case 'nao_conforme': return <Badge variant="destructive">Não Conforme</Badge>;
      case 'nao_aplicavel': return <Badge variant="secondary">N/A</Badge>;
      default: return <Badge variant="outline">Não Avaliado</Badge>;
    }
  };

  const getPlanoStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'outline' }> = {
      concluido: { label: 'Concluído', variant: 'success' },
      em_andamento: { label: 'Em Andamento', variant: 'warning' },
      pendente: { label: 'Pendente', variant: 'destructive' },
      cancelado: { label: 'Cancelado', variant: 'outline' },
    };
    const s = map[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const isNonCompliant = requirement.conformity_status === 'nao_conforme' || requirement.conformity_status === 'parcial';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-sm text-muted-foreground">{requirement.codigo}</span>
                  {getStatusBadge(requirement.conformity_status)}
                  {requirement.obrigatorio && (
                    <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                  )}
                  {(requirement.peso || 0) >= 3 && (
                    <Badge variant="outline" className="text-xs">Peso {requirement.peso}</Badge>
                  )}
                </div>
                <p className="text-base font-medium">{requirement.titulo}</p>
                {requirement.descricao && (
                  <p className="text-sm text-muted-foreground font-normal mt-2">{requirement.descricao}</p>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Orientação de Implementação */}
              {requirementDetails.orientacao_implementacao && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">Como implementar este requisito?</p>
                        <p className="text-sm text-foreground whitespace-pre-line">{requirementDetails.orientacao_implementacao}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Exemplos de Evidências Sugeridas */}
              {requirementDetails.exemplos_evidencias && (
                <Card className="border-amber-500/20 bg-amber-500/5">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">Evidências Sugeridas</p>
                        <ul className="text-sm text-foreground space-y-1">
                          {requirementDetails.exemplos_evidencias.split('\n').filter(Boolean).map((ex, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-amber-500 mt-0.5">•</span>
                              <span>{ex.replace(/^[-•]\s*/, '')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Plano de Ação Integrado */}
              {isNonCompliant && (
                <Card className="border-destructive/20">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-destructive" />
                        <p className="text-sm font-semibold">Plano de Ação</p>
                      </div>
                      {!planoAcaoVinculado && (
                        <Button size="sm" variant="outline" onClick={handleCreatePlanoAcao}>
                          <ClipboardList className="h-4 w-4 mr-1" />
                          Criar Plano de Ação
                        </Button>
                      )}
                    </div>
                    {planoAcaoVinculado ? (
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{planoAcaoVinculado.titulo}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getPlanoStatusBadge(planoAcaoVinculado.status)}
                            {planoAcaoVinculado.prazo && (
                              <span className="text-xs text-muted-foreground">
                                Prazo: {new Date(planoAcaoVinculado.prazo).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => window.open('/planos-acao', '_blank')}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        <AlertTriangle className="h-4 w-4 inline mr-1 text-amber-500" />
                        Este requisito está não conforme. Crie um plano de ação para rastrear as tarefas necessárias.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Responsável */}
              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável pela Avaliação</Label>
                <Select
                  value={formData.responsavel_avaliacao}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, responsavel_avaliacao: value }))}
                >
                  <SelectTrigger id="responsavel">
                    <SelectValue placeholder="Selecionar usuário..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.nome} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Plano de Ação (texto livre) */}
              <div className="space-y-2">
                <Label htmlFor="plano">Notas do Plano de Ação</Label>
                <Textarea
                  id="plano"
                  placeholder="Descrever as ações necessárias para atender ao requisito..."
                  value={formData.plano_acao}
                  onChange={(e) => setFormData(prev => ({ ...prev, plano_acao: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Informações adicionais, contexto, justificativas..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Prazo de Implementação */}
              <div className="space-y-2">
                <Label htmlFor="prazo" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Prazo de Implementação
                </Label>
                <input
                  id="prazo"
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.prazo_implementacao}
                  onChange={(e) => setFormData(prev => ({ ...prev, prazo_implementacao: e.target.value }))}
                />
              </div>

              {/* Riscos Vinculados */}
              <div className="space-y-2">
                <Label>Riscos Vinculados</Label>
                <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                  {riscos.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum risco cadastrado</p>
                  ) : (
                    riscos.map(risco => (
                      <label key={risco.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={formData.riscos_vinculados.includes(risco.id)}
                          onChange={() => handleToggleRisco(risco.id)}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium">{risco.nome}</span>
                          <Badge variant="outline" className="ml-2 text-xs">{risco.nivel_risco_inicial}</Badge>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Evidências */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Evidências
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => document.getElementById('file-upload')?.click()}>
                      {uploading ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</>
                      ) : (
                        <><Upload className="h-4 w-4 mr-2" />Anexar Arquivo</>
                      )}
                    </Button>
                    <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
                  </div>

                  {formData.evidence_files.length > 0 && (
                    <div className="border rounded-md p-3 space-y-2">
                      {formData.evidence_files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm truncate">{file.name}</span>
                            {file.size && <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(0)}KB)</span>}
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveFile(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>) : ('Salvar Detalhes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PlanoAcaoDialog
        open={planoAcaoDialogOpen}
        onOpenChange={setPlanoAcaoDialogOpen}
        onSave={handleSavePlanoAcao}
        loading={savingPlano}
        plano={{
          titulo: `Adequar: ${requirement.codigo} - ${requirement.titulo}`,
          descricao: requirement.descricao || '',
          prioridade: (requirement.peso || 0) >= 3 ? 'alta' : 'media',
          modulo_origem: 'frameworks',
          registro_origem_titulo: `${requirement.codigo} - ${requirement.titulo}`,
        }}
      />
    </>
  );
};
