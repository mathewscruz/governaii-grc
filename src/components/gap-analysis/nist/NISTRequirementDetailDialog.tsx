import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { Loader2, Upload, X, FileText, Calendar, Lightbulb, ClipboardList, CheckCircle2, ExternalLink, AlertTriangle, ChevronDown, History, BookOpen, HelpCircle } from "lucide-react";
import { formatDateForInput, parseDateForDB } from "@/lib/date-utils";
import { PlanoAcaoDialog } from "@/components/planos-acao/PlanoAcaoDialog";
import { AuditTrailTimeline } from "@/components/gap-analysis/AuditTrailTimeline";

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

interface User { user_id: string; nome: string; email: string; }
interface Risco { id: string; nome: string; nivel_risco_inicial: string; }
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

const CollapsibleSection = ({ title, icon: Icon, defaultOpen = false, badge, children }: {
  title: string; icon: any; defaultOpen?: boolean; badge?: React.ReactNode; children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors text-left group">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{title}</span>
            {badge}
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

export const NISTRequirementDetailDialog: React.FC<NISTRequirementDetailDialogProps> = ({
  open, onOpenChange, requirement, frameworkId, onClose
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
    responsavel_avaliacao: '', plano_acao: '', observacoes: '',
    prazo_implementacao: '', riscos_vinculados: [], evidence_files: [], plano_acao_id: null
  });

  useEffect(() => {
    if (open && empresaId) loadData();
  }, [open, empresaId, requirement.id]);

  const loadData = async () => {
    setLoading(true);
    try {
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

      if (requirement.evaluation_id) {
        const { data: evalData, error: evalError } = await supabase
          .from('gap_analysis_evaluations').select('*').eq('id', requirement.evaluation_id).single();
        if (evalError) throw evalError;

        const { data: linkedRiscos } = await supabase
          .from('gap_evaluation_risks').select('risco_id').eq('evaluation_id', requirement.evaluation_id);

        if (evalData.plano_acao_id) {
          const { data: planoData } = await supabase
            .from('planos_acao').select('id, titulo, status, prioridade, prazo').eq('id', evalData.plano_acao_id).single();
          setPlanoAcaoVinculado(planoData);
        } else {
          setPlanoAcaoVinculado(null);
        }

        setFormData({
          id: evalData.id, responsavel_avaliacao: evalData.responsavel_avaliacao || '',
          plano_acao: evalData.plano_acao || '', observacoes: evalData.observacoes || '',
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
      toast.error('Erro ao fazer upload');
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
        const { error } = await supabase.from('gap_analysis_evaluations').update({
          responsavel_avaliacao: formData.responsavel_avaliacao || null,
          plano_acao: formData.plano_acao || null, observacoes: formData.observacoes || null,
          prazo_implementacao: formData.prazo_implementacao ? parseDateForDB(formData.prazo_implementacao) : null,
          evidence_files: formData.evidence_files, plano_acao_id: formData.plano_acao_id || null,
          updated_at: new Date().toISOString()
        }).eq('id', evaluationId);
        if (error) throw error;
      } else {
        const { data: newEval, error } = await supabase.from('gap_analysis_evaluations').insert({
          framework_id: frameworkId, requirement_id: requirement.id, empresa_id: empresaId,
          responsavel_avaliacao: formData.responsavel_avaliacao || null,
          plano_acao: formData.plano_acao || null, observacoes: formData.observacoes || null,
          prazo_implementacao: formData.prazo_implementacao ? parseDateForDB(formData.prazo_implementacao) : null,
          evidence_files: formData.evidence_files, plano_acao_id: formData.plano_acao_id || null,
          conformity_status: requirement.conformity_status || 'pendente',
          evidence_status: 'pendente', status: 'em_andamento'
        }).select().single();
        if (error) throw error;
        evaluationId = newEval.id;
      }

      await supabase.from('gap_evaluation_risks').delete().eq('evaluation_id', evaluationId);
      if (formData.riscos_vinculados.length > 0) {
        const { error } = await supabase.from('gap_evaluation_risks')
          .insert(formData.riscos_vinculados.map(riscoId => ({ evaluation_id: evaluationId, risco_id: riscoId })));
        if (error) throw error;
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

  const handleSavePlanoAcao = async (planoData: any) => {
    setSavingPlano(true);
    try {
      const { data: newPlano, error } = await supabase.from('planos_acao').insert({
        ...planoData, empresa_id: empresaId, modulo_origem: 'frameworks',
        registro_origem_titulo: `${requirement.codigo} - ${requirement.titulo}`,
      }).select().single();
      if (error) throw error;
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

  const hasGuidance = !!(requirementDetails.orientacao_implementacao || requirementDetails.exemplos_evidencias || requirement.descricao);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 gap-0">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-mono text-sm text-muted-foreground">{requirement.codigo}</span>
                  {getStatusBadge(requirement.conformity_status)}
                  {requirement.obrigatorio && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
                  {(requirement.peso || 0) >= 3 && <Badge variant="outline" className="text-xs">Peso {requirement.peso}</Badge>}
                </div>
                <p className="text-base font-medium">{requirement.titulo}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row min-h-0 flex-1">
              {/* LEFT PANEL — Educational context */}
              {hasGuidance && (
                <ScrollArea className="md:w-[40%] border-r bg-muted/30 max-h-[60vh]">
                  <div className="p-5 space-y-5">
                    {/* Description */}
                    {requirement.descricao && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <h4 className="text-sm font-semibold text-foreground">Descrição do Requisito</h4>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{requirement.descricao}</p>
                      </div>
                    )}

                    {/* Implementation guidance */}
                    {requirementDetails.orientacao_implementacao && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Lightbulb className="h-4 w-4 text-chart-4" />
                          <h4 className="text-sm font-semibold text-foreground">O que este controle exige</h4>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                          {requirementDetails.orientacao_implementacao}
                        </p>
                      </div>
                    )}

                    {/* Evidence examples */}
                    {requirementDetails.exemplos_evidencias && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-chart-2" />
                          <h4 className="text-sm font-semibold text-foreground">Exemplos de Evidências Aceitas</h4>
                        </div>
                        <ul className="space-y-1.5">
                          {requirementDetails.exemplos_evidencias.split('\n').filter(Boolean).map((ex, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className="h-3.5 w-3.5 text-chart-2 shrink-0 mt-0.5" />
                              <span>{ex.replace(/^[-•]\s*/, '')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Self-assessment tips */}
                    {!requirementDetails.orientacao_implementacao && !requirementDetails.exemplos_evidencias && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-dashed">
                        <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                          Orientações detalhadas para este requisito ainda não foram geradas. Avalie com base na descrição acima e no conhecimento da sua organização.
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}

              {/* RIGHT PANEL — Form & actions */}
              <ScrollArea className={`${hasGuidance ? 'md:w-[60%]' : 'w-full'} max-h-[60vh]`}>
                <div className="p-5 space-y-1">
                  {/* Always visible: Responsável + Prazo + Observações */}
                  <div className="space-y-4 p-3 rounded-lg border bg-card">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="responsavel" className="text-xs">Responsável</Label>
                        <Select
                          value={formData.responsavel_avaliacao}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, responsavel_avaliacao: value }))}
                        >
                          <SelectTrigger id="responsavel"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                          <SelectContent>
                            {users.map(user => (
                              <SelectItem key={user.user_id} value={user.user_id}>{user.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="prazo" className="text-xs flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />Prazo
                        </Label>
                        <input
                          id="prazo" type="date"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={formData.prazo_implementacao}
                          onChange={(e) => setFormData(prev => ({ ...prev, prazo_implementacao: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="observacoes" className="text-xs">Observações</Label>
                      <Textarea
                        id="observacoes" placeholder="Informações adicionais, contexto, justificativas..."
                        value={formData.observacoes}
                        onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Collapsible sections */}
                  <div className="divide-y rounded-lg border">
                    {/* Plano de Ação */}
                    {isNonCompliant && (
                      <CollapsibleSection
                        title="Plano de Ação"
                        icon={ClipboardList}
                        defaultOpen={isNonCompliant}
                        badge={planoAcaoVinculado ? getPlanoStatusBadge(planoAcaoVinculado.status) : <Badge variant="outline" className="text-[10px]">Sem plano</Badge>}
                      >
                        {planoAcaoVinculado ? (
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{planoAcaoVinculado.titulo}</p>
                              {planoAcaoVinculado.prazo && (
                                <span className="text-xs text-muted-foreground">Prazo: {new Date(planoAcaoVinculado.prazo).toLocaleDateString('pt-BR')}</span>
                              )}
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => window.open('/planos-acao', '_blank')}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              <AlertTriangle className="h-4 w-4 inline mr-1 text-amber-500" />
                              Requisito não conforme. Crie um plano de ação.
                            </p>
                            <Button size="sm" variant="outline" onClick={() => setPlanoAcaoDialogOpen(true)}>
                              <ClipboardList className="h-4 w-4 mr-1" />Criar Plano de Ação
                            </Button>
                          </div>
                        )}
                        <div className="mt-3 space-y-1.5">
                          <Label htmlFor="plano" className="text-xs">Notas do Plano</Label>
                          <Textarea
                            id="plano" placeholder="Ações necessárias..."
                            value={formData.plano_acao}
                            onChange={(e) => setFormData(prev => ({ ...prev, plano_acao: e.target.value }))}
                            rows={2}
                          />
                        </div>
                      </CollapsibleSection>
                    )}

                    {/* Evidências */}
                    <CollapsibleSection
                      title="Evidências"
                      icon={FileText}
                      badge={formData.evidence_files.length > 0 ? <Badge variant="secondary" className="text-[10px]">{formData.evidence_files.length}</Badge> : undefined}
                    >
                      <div className="space-y-3">
                        <div
                          className="relative border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer"
                          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary', 'bg-primary/5'); }}
                          onDragLeave={(e) => { e.currentTarget.classList.remove('border-primary', 'bg-primary/5'); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                            const files = e.dataTransfer.files;
                            if (files.length > 0) {
                              const input = document.getElementById('file-upload') as HTMLInputElement;
                              if (input) { input.files = files; input.dispatchEvent(new Event('change', { bubbles: true })); }
                            }
                          }}
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          <Upload className="h-6 w-6 mx-auto text-muted-foreground/50 mb-1" />
                          <p className="text-sm text-muted-foreground">{uploading ? 'Enviando...' : 'Arraste arquivos ou clique para buscar'}</p>
                        </div>
                        <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
                        <Button type="button" variant="outline" size="sm" onClick={() => {
                          const url = prompt('URL da evidência:');
                          if (url?.trim()) {
                            const name = prompt('Nome do link:') || new URL(url).hostname;
                            setFormData(prev => ({ ...prev, evidence_files: [...prev.evidence_files, { type: 'link', name, url: url.trim() }] }));
                          }
                        }}>
                          <ExternalLink className="h-4 w-4 mr-1" />Adicionar Link
                        </Button>

                        {formData.evidence_files.length > 0 && (
                          <div className="border rounded-md p-2 space-y-1">
                            {formData.evidence_files.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-1.5 bg-muted/50 rounded text-sm">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {file.type === 'link' ? <ExternalLink className="h-3.5 w-3.5 text-blue-500 shrink-0" /> : <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                                  {file.type === 'link' ? (
                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate text-xs" onClick={(e) => e.stopPropagation()}>{file.name}</a>
                                  ) : (
                                    <span className="truncate text-xs">{file.name}</span>
                                  )}
                                </div>
                                <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleRemoveFile(index)}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CollapsibleSection>

                    {/* Riscos Vinculados */}
                    <CollapsibleSection
                      title="Riscos Vinculados"
                      icon={AlertTriangle}
                      badge={formData.riscos_vinculados.length > 0 ? <Badge variant="secondary" className="text-[10px]">{formData.riscos_vinculados.length}</Badge> : undefined}
                    >
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {riscos.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-3">Nenhum risco cadastrado</p>
                        ) : (
                          riscos.map(risco => (
                            <label key={risco.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1.5 rounded text-sm">
                              <input type="checkbox" checked={formData.riscos_vinculados.includes(risco.id)} onChange={() => handleToggleRisco(risco.id)} className="rounded" />
                              <span className="font-medium">{risco.nome}</span>
                              <Badge variant="outline" className="ml-auto text-xs">{risco.nivel_risco_inicial}</Badge>
                            </label>
                          ))
                        )}
                      </div>
                    </CollapsibleSection>

                    {/* Histórico */}
                    <CollapsibleSection title="Histórico de Alterações" icon={History}>
                      <div className="max-h-48 overflow-y-auto">
                        <AuditTrailTimeline requirementId={requirement.id} frameworkId={frameworkId} />
                      </div>
                    </CollapsibleSection>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}

          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : 'Salvar Detalhes'}
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
