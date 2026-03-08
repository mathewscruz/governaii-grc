import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { Loader2, Upload, X, FileText, Calendar, Lightbulb, ClipboardList, CheckCircle2, ExternalLink, AlertTriangle, ChevronDown, History, BookOpen, RefreshCw, HelpCircle, Building2, Settings, FileCheck, CheckSquare, Shield, Target, type LucideIcon } from "lucide-react";
import { formatDateForInput, parseDateForDB } from "@/lib/date-utils";
import { PlanoAcaoDialog } from "@/components/planos-acao/PlanoAcaoDialog";
import { AuditTrailTimeline } from "@/components/gap-analysis/AuditTrailTimeline";

interface RequirementDetail {
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

interface RequirementDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirement: RequirementDetail;
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

/** Icon mapping for section titles based on keywords */
const getSectionIcon = (title: string): { icon: LucideIcon; color: string } => {
  const t = title.toLowerCase();
  if (t.includes('significa') || t.includes('conceito') || t.includes('what')) return { icon: Target, color: 'text-primary' };
  if (t.includes('importa') || t.includes('relevância') || t.includes('why') || t.includes('negócio')) return { icon: Building2, color: 'text-amber-500' };
  if (t.includes('implementar') || t.includes('como') || t.includes('how') || t.includes('passo')) return { icon: Settings, color: 'text-blue-500' };
  if (t.includes('resumo') || t.includes('conclus') || t.includes('prático') || t.includes('summary')) return { icon: CheckSquare, color: 'text-emerald-500' };
  if (t.includes('evidência') || t.includes('comprova') || t.includes('evidence') || t.includes('documento')) return { icon: FileCheck, color: 'text-violet-500' };
  if (t.includes('risco') || t.includes('atenção') || t.includes('risk') || t.includes('cuidado')) return { icon: AlertTriangle, color: 'text-destructive' };
  if (t.includes('controle') || t.includes('medida') || t.includes('proteção')) return { icon: Shield, color: 'text-cyan-500' };
  return { icon: BookOpen, color: 'text-muted-foreground' };
};

const inlineMd = (text: string): string => {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
};

/** Renders a list of lines into JSX elements (paragraphs, bullets, numbered lists) */
const renderContentLines = (lines: string[]): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let isNumberedList = false;

  const flushList = () => {
    if (listItems.length === 0) return;
    if (isNumberedList) {
      elements.push(
        <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-1.5 ml-1">
          {listItems.map((item, i) => (
            <li key={i} className="text-sm text-muted-foreground leading-relaxed">
              <span dangerouslySetInnerHTML={{ __html: inlineMd(item) }} />
            </li>
          ))}
        </ol>
      );
    } else {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-1.5 ml-1">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
              <span className="text-primary mt-1.5 text-[6px]">●</span>
              <span dangerouslySetInnerHTML={{ __html: inlineMd(item) }} />
            </li>
          ))}
        </ul>
      );
    }
    listItems = [];
    isNumberedList = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === '' || trimmed === '---') { flushList(); continue; }

    const h3Match = trimmed.match(/^###\s+(.+)/);
    if (h3Match) {
      flushList();
      elements.push(
        <h4 key={`h3-${i}`} className="text-sm font-semibold text-foreground mt-3 mb-1.5">{h3Match[1]}</h4>
      );
      continue;
    }

    const bulletMatch = trimmed.match(/^[-•*]\s+(.+)/);
    if (bulletMatch) {
      if (listItems.length > 0 && isNumberedList) flushList();
      isNumberedList = false;
      listItems.push(bulletMatch[1]);
      continue;
    }

    const numMatch = trimmed.match(/^\d+[.)]\s+(.+)/);
    if (numMatch) {
      if (listItems.length > 0 && !isNumberedList) flushList();
      isNumberedList = true;
      listItems.push(numMatch[1]);
      continue;
    }

    flushList();
    elements.push(
      <p key={`p-${i}`} className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: inlineMd(trimmed) }} />
    );
  }
  flushList();
  return elements;
};

/** Strips AI preamble lines (e.g. "Com certeza! Aqui está...") before the first ## */
const sanitizeGuidanceContent = (raw: string): string => {
  // Find first ## header
  const firstHeaderIdx = raw.indexOf('\n##');
  if (firstHeaderIdx === -1) {
    // Check if it starts with ##
    if (raw.trimStart().startsWith('##')) return raw;
    return raw;
  }
  const preamble = raw.substring(0, firstHeaderIdx).trim();
  // If preamble looks like AI chatter (no ## and short), strip it
  if (preamble && !preamble.includes('##') && preamble.length < 300) {
    return raw.substring(firstHeaderIdx + 1);
  }
  return raw;
};

/** Structured Markdown renderer — groups ## sections into visual cards */
const MarkdownContent = ({ content }: { content: string }) => {
  const sanitized = sanitizeGuidanceContent(content);
  const lines = sanitized.split('\n');

  // Split into sections: intro (before first ##) and named sections
  const sections: Array<{ title: string | null; lines: string[] }> = [];
  let current: { title: string | null; lines: string[] } = { title: null, lines: [] };

  for (const line of lines) {
    const h2Match = line.trim().match(/^##\s+(.+)/);
    if (h2Match) {
      if (current.lines.length > 0 || current.title) sections.push(current);
      current = { title: h2Match[1], lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.lines.length > 0 || current.title) sections.push(current);

  return (
    <div className="space-y-4">
      {sections.map((section, idx) => {
        // Intro text (before any ##)
        if (!section.title) {
          const contentElements = renderContentLines(section.lines);
          if (contentElements.length === 0) return null;
          return (
            <div key={idx} className="text-sm text-foreground/80 italic leading-relaxed space-y-2">
              {contentElements}
            </div>
          );
        }

        // Named section → card
        const { icon: SectionIcon, color } = getSectionIcon(section.title);
        return (
          <div key={idx} className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className={`flex items-center justify-center h-7 w-7 rounded-md bg-background border border-border ${color}`}>
                <SectionIcon className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">{section.title}</h3>
            </div>
            <div className="space-y-2.5 pl-[38px]">
              {renderContentLines(section.lines)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Skeleton for guidance loading */
const GuidanceSkeleton = () => (
  <div className="space-y-4 p-5">
    <div className="space-y-2">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[90%]" />
      <Skeleton className="h-4 w-[80%]" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-5 w-56" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[85%]" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-5 w-44" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[75%]" />
      <Skeleton className="h-4 w-[90%]" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-5 w-52" />
      <Skeleton className="h-3 w-[80%]" />
      <Skeleton className="h-3 w-[70%]" />
      <Skeleton className="h-3 w-[85%]" />
      <Skeleton className="h-3 w-[65%]" />
    </div>
  </div>
);

export const RequirementDetailDialog: React.FC<RequirementDetailDialogProps> = ({
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
  const [guidanceText, setGuidanceText] = useState<string | null>(null);
  const [evidenciasText, setEvidenciasText] = useState<string | null>(null);
  const [generatingGuidance, setGeneratingGuidance] = useState(false);
  const [diagnosticQuestions, setDiagnosticQuestions] = useState<Array<{pergunta: string; peso: number}>>([]);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<number, 'sim' | 'parcial' | 'nao' | null>>({});

  const [formData, setFormData] = useState<EvaluationData>({
    responsavel_avaliacao: '', plano_acao: '', observacoes: '',
    prazo_implementacao: '', riscos_vinculados: [], evidence_files: [], plano_acao_id: null
  });

  useEffect(() => {
    if (open && empresaId) loadData();
  }, [open, empresaId, requirement.id]);

  const triggerGuidanceGeneration = useCallback(async (forceRegenerate = false) => {
    setGeneratingGuidance(true);
    try {
      const { data, error } = await supabase.functions.invoke('populate-requirement-guidance', {
        body: { requirement_id: requirement.id }
      });
      if (error) throw error;
      if (data?.orientacao_implementacao) {
        setGuidanceText(data.orientacao_implementacao);
        setEvidenciasText(data.exemplos_evidencias || null);
      }
      if (data?.perguntas_diagnostico) {
        try {
          const parsed = JSON.parse(data.perguntas_diagnostico);
          if (Array.isArray(parsed)) setDiagnosticQuestions(parsed);
        } catch { /* ignore parse errors */ }
      }
    } catch (error: any) {
      console.error('Error generating guidance:', error);
      if (error?.message?.includes('402') || error?.status === 402) {
        toast.error('Créditos de IA esgotados. Entre em contato com a Akuris para adquirir mais créditos.');
      } else if (forceRegenerate) {
        toast.error('Erro ao gerar orientações');
      }
    } finally {
      setGeneratingGuidance(false);
    }
  }, [requirement.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, riscosRes, reqDetailsRes] = await Promise.all([
        supabase.from('profiles').select('user_id, nome, email').eq('empresa_id', empresaId).order('nome'),
        supabase.from('riscos').select('id, nome, nivel_risco_inicial').eq('empresa_id', empresaId).order('nome'),
        supabase.from('gap_analysis_requirements').select('orientacao_implementacao, exemplos_evidencias, perguntas_diagnostico').eq('id', requirement.id).single()
      ]);
      if (usersRes.error) throw usersRes.error;
      if (riscosRes.error) throw riscosRes.error;
      setUsers(usersRes.data || []);
      setRiscos(riscosRes.data || []);

      const details = reqDetailsRes.data as { orientacao_implementacao?: string | null; exemplos_evidencias?: string | null; perguntas_diagnostico?: string | null } || {};
      setGuidanceText(details.orientacao_implementacao || null);
      setEvidenciasText(details.exemplos_evidencias || null);

      // Parse diagnostic questions
      if (details.perguntas_diagnostico) {
        try {
          const parsed = JSON.parse(details.perguntas_diagnostico);
          if (Array.isArray(parsed)) setDiagnosticQuestions(parsed);
        } catch { /* ignore */ }
      } else {
        setDiagnosticQuestions([]);
      }
      setDiagnosticAnswers({});

      // Auto-trigger generation if no guidance exists
      if (!details.orientacao_implementacao) {
        triggerGuidanceGeneration();
      }

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

        // Load diagnostic answers from evaluation
        if (evalData.diagnostic_answers && typeof evalData.diagnostic_answers === 'object') {
          setDiagnosticAnswers(evalData.diagnostic_answers as Record<number, 'sim' | 'parcial' | 'nao' | null>);
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
          diagnostic_answers: Object.keys(diagnosticAnswers).length > 0 ? diagnosticAnswers : null,
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
          diagnostic_answers: Object.keys(diagnosticAnswers).length > 0 ? diagnosticAnswers : null,
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 gap-0">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm text-muted-foreground">{requirement.codigo}</span>
              <span className="text-base font-medium">{requirement.titulo}</span>
              {requirement.obrigatorio && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
              {(requirement.peso || 0) >= 3 && <Badge variant="outline" className="text-xs">Peso {requirement.peso}</Badge>}
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row min-h-0 flex-1">
              {/* LEFT PANEL — Educational context */}
              <ScrollArea className="md:w-[40%] border-r bg-muted/30 max-h-[60vh]">
                <div className="p-5 space-y-4">
                  {/* Regenerate button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold text-foreground">Orientação do Requisito</h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => triggerGuidanceGeneration(true)}
                      disabled={generatingGuidance}
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${generatingGuidance ? 'animate-spin' : ''}`} />
                      {generatingGuidance ? 'Gerando...' : 'Regenerar'}
                    </Button>
                  </div>

                  {/* Loading state */}
                  {generatingGuidance && !guidanceText ? (
                    <GuidanceSkeleton />
                  ) : guidanceText ? (
                    <>
                      <MarkdownContent content={guidanceText} />

                      {/* Evidence examples - rendered separately if present */}
                      {evidenciasText && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <div className="flex items-center gap-1.5 mb-3">
                            <CheckCircle2 className="h-4 w-4 text-chart-2" />
                            <h4 className="text-sm font-bold text-foreground">Exemplos de Evidências Aceitas</h4>
                          </div>
                          <ul className="space-y-2">
                            {evidenciasText.split('\n').filter(l => l.trim()).map((ex, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-3.5 w-3.5 text-chart-2 shrink-0 mt-0.5" />
                                <span>{ex.replace(/^[-•*]\s*/, '').trim()}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Diagnostic Questions Section */}
                      {diagnosticQuestions.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <div className="flex items-center gap-1.5 mb-3">
                            <HelpCircle className="h-4 w-4 text-primary" />
                            <h4 className="text-sm font-bold text-foreground">Diagnóstico Rápido</h4>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">
                            Responda as perguntas abaixo para uma sugestão automática de status.
                          </p>
                          <div className="space-y-3">
                            {diagnosticQuestions.map((q, idx) => {
                              const answer = diagnosticAnswers[idx] || null;
                              return (
                                <div key={idx} className="p-3 rounded-lg bg-card border space-y-2">
                                  <p className="text-sm text-foreground leading-relaxed">
                                    {q.peso >= 2 && <Badge variant="outline" className="text-[10px] mr-1.5">Peso {q.peso}</Badge>}
                                    {q.pergunta}
                                  </p>
                                  <div className="flex gap-2">
                                    {(['sim', 'parcial', 'nao'] as const).map(opt => (
                                      <Button
                                        key={opt}
                                        size="sm"
                                        variant={answer === opt ? 'default' : 'outline'}
                                        className={`text-xs h-7 px-3 ${
                                          answer === opt && opt === 'sim' ? 'bg-chart-2 hover:bg-chart-2/90 text-white' :
                                          answer === opt && opt === 'parcial' ? 'bg-chart-4 hover:bg-chart-4/90 text-white' :
                                          answer === opt && opt === 'nao' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''
                                        }`}
                                        onClick={() => setDiagnosticAnswers(prev => ({ ...prev, [idx]: opt }))}
                                      >
                                        {opt === 'sim' ? 'Sim' : opt === 'parcial' ? 'Parcial' : 'Não'}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Suggested status based on answers */}
                          {Object.keys(diagnosticAnswers).length > 0 && (
                            <div className="mt-3 p-3 rounded-lg bg-muted/50 border">
                              <p className="text-xs font-medium text-foreground mb-1">Status sugerido:</p>
                              {(() => {
                                const answered = Object.entries(diagnosticAnswers).filter(([, v]) => v !== null);
                                if (answered.length === 0) return <p className="text-xs text-muted-foreground">Responda ao menos uma pergunta.</p>;
                                let totalWeight = 0;
                                let weightedScore = 0;
                                answered.forEach(([idx, ans]) => {
                                  const w = diagnosticQuestions[Number(idx)]?.peso || 1;
                                  totalWeight += w;
                                  if (ans === 'sim') weightedScore += w * 1;
                                  else if (ans === 'parcial') weightedScore += w * 0.5;
                                });
                                const pct = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;
                                const suggested = pct >= 80 ? 'Conforme' : pct >= 40 ? 'Parcial' : 'Não Conforme';
                                const color = pct >= 80 ? 'text-chart-2' : pct >= 40 ? 'text-chart-4' : 'text-destructive';
                                return (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={`${color} font-semibold`}>{suggested}</Badge>
                                    <span className="text-xs text-muted-foreground">({Math.round(pct)}% de aderência)</span>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    /* Fallback: show basic description if no guidance and not generating */
                    <div className="space-y-3">
                      {requirement.descricao && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{requirement.descricao}</p>
                      )}
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-dashed">
                        <Lightbulb className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                          Clique em "Regenerar" para gerar orientações detalhadas para este requisito.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* RIGHT PANEL — Form & actions */}
              <ScrollArea className="md:w-[60%] max-h-[60vh]">
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
