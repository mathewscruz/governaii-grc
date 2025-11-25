import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { Loader2, Upload, X, FileText, Calendar } from "lucide-react";
import { formatDateForInput, parseDateForDB } from "@/lib/date-utils";

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

  const [formData, setFormData] = useState<EvaluationData>({
    responsavel_avaliacao: '',
    plano_acao: '',
    observacoes: '',
    prazo_implementacao: '',
    riscos_vinculados: [],
    evidence_files: []
  });

  useEffect(() => {
    if (open && empresaId) {
      loadData();
    }
  }, [open, empresaId, requirement.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar usuários da empresa
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, nome, email')
        .eq('empresa_id', empresaId)
        .order('nome');

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Carregar riscos da empresa
      const { data: riscosData, error: riscosError } = await supabase
        .from('riscos')
        .select('id, nome, nivel_risco_inicial')
        .eq('empresa_id', empresaId)
        .order('nome');

      if (riscosError) throw riscosError;
      setRiscos(riscosData || []);

      // Carregar avaliação existente
      if (requirement.evaluation_id) {
        const { data: evalData, error: evalError } = await supabase
          .from('gap_analysis_evaluations')
          .select('*')
          .eq('id', requirement.evaluation_id)
          .single();

        if (evalError) throw evalError;

        // Carregar riscos vinculados
        const { data: linkedRiscos, error: linkedError } = await supabase
          .from('gap_evaluation_risks')
          .select('risco_id')
          .eq('evaluation_id', requirement.evaluation_id);

        if (linkedError) throw linkedError;

        setFormData({
          id: evalData.id,
          responsavel_avaliacao: evalData.responsavel_avaliacao || '',
          plano_acao: evalData.plano_acao || '',
          observacoes: evalData.observacoes || '',
          prazo_implementacao: evalData.prazo_implementacao ? formatDateForInput(evalData.prazo_implementacao) : '',
          riscos_vinculados: linkedRiscos?.map(r => r.risco_id) || [],
          evidence_files: Array.isArray(evalData.evidence_files) ? evalData.evidence_files : []
        });
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

        const { error: uploadError, data } = await supabase.storage
          .from('documentos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('documentos')
          .getPublicUrl(filePath);

        uploadedFiles.push({
          name: file.name,
          url: publicUrl,
          size: file.size,
          type: file.type
        });
      }

      setFormData(prev => ({
        ...prev,
        evidence_files: [...prev.evidence_files, ...uploadedFiles]
      }));

      toast.success(`${uploadedFiles.length} arquivo(s) anexado(s)`);
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast.error('Erro ao fazer upload de arquivos');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      evidence_files: prev.evidence_files.filter((_, i) => i !== index)
    }));
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

      // Criar ou atualizar avaliação
      if (evaluationId) {
        // Atualizar
        const { error: updateError } = await supabase
          .from('gap_analysis_evaluations')
          .update({
            responsavel_avaliacao: formData.responsavel_avaliacao || null,
            plano_acao: formData.plano_acao || null,
            observacoes: formData.observacoes || null,
            prazo_implementacao: formData.prazo_implementacao ? parseDateForDB(formData.prazo_implementacao) : null,
            evidence_files: formData.evidence_files,
            updated_at: new Date().toISOString()
          })
          .eq('id', evaluationId);

        if (updateError) throw updateError;
      } else {
        // Criar nova avaliação
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
      // Remover vinculações antigas
      await supabase
        .from('gap_evaluation_risks')
        .delete()
        .eq('evaluation_id', evaluationId);

      // Inserir novas vinculações
      if (formData.riscos_vinculados.length > 0) {
        const { error: riscoError } = await supabase
          .from('gap_evaluation_risks')
          .insert(
            formData.riscos_vinculados.map(riscoId => ({
              evaluation_id: evaluationId,
              risco_id: riscoId
            }))
          );

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

  const getStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'conforme':
        return <Badge variant="success">Conforme</Badge>;
      case 'parcial':
        return <Badge variant="warning">Parcial</Badge>;
      case 'nao_conforme':
        return <Badge variant="destructive">Não Conforme</Badge>;
      case 'nao_aplicavel':
        return <Badge variant="secondary">N/A</Badge>;
      default:
        return <Badge variant="outline">Não Avaliado</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-sm text-muted-foreground">{requirement.codigo}</span>
                {getStatusBadge(requirement.conformity_status)}
              </div>
              <p className="text-base font-medium">{requirement.titulo}</p>
              {requirement.descricao && (
                <p className="text-sm text-muted-foreground font-normal mt-2">
                  {requirement.descricao}
                </p>
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

            {/* Plano de Ação */}
            <div className="space-y-2">
              <Label htmlFor="plano">Plano de Ação</Label>
              <Textarea
                id="plano"
                placeholder="Descrever as ações necessárias para atender ao requisito..."
                value={formData.plano_acao}
                onChange={(e) => setFormData(prev => ({ ...prev, plano_acao: e.target.value }))}
                rows={4}
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
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum risco cadastrado
                  </p>
                ) : (
                  riscos.map(risco => (
                    <label
                      key={risco.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={formData.riscos_vinculados.includes(risco.id)}
                        onChange={() => handleToggleRisco(risco.id)}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium">{risco.nome}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {risco.nivel_risco_inicial}
                        </Badge>
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Anexar Arquivo
                      </>
                    )}
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  />
                </div>

                {formData.evidence_files.length > 0 && (
                  <div className="border rounded-md p-3 space-y-2">
                    {formData.evidence_files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                          {file.size && (
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024).toFixed(0)}KB)
                            </span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                        >
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Detalhes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
