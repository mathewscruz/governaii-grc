import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { Loader2, FileText, Shield, Upload, X } from 'lucide-react';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

interface AdherenceAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AdherenceAssessmentDialog({ open, onOpenChange, onSuccess }: AdherenceAssessmentDialogProps) {
  const { toast } = useToast();
  const { empresaId, loading: loadingEmpresa } = useEmpresaId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    nome_analise: '',
    descricao: '',
    framework_id: ''
  });

  // Configurar worker do PDF.js
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  // Buscar frameworks disponíveis
  const { data: frameworks, loading: loadingFrameworks } = useOptimizedQuery(
    async () => {
      const { data, error } = await supabase
        .from('gap_analysis_frameworks')
        .select('id, nome, versao')
        .order('nome');
      
      if (error) throw error;
      return { data, error: null };
    },
    [],
    { cacheKey: 'frameworks-for-adherence', cacheDuration: 60000 }
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo (PDF, DOCX, DOC, TXT)
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Por favor, envie apenas arquivos PDF, DOCX, DOC ou TXT.",
          variant: "destructive"
        });
        return;
      }
      
      // Validar tamanho (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB.",
          variant: "destructive"
        });
        return;
      }
      
      setUploadedFile(file);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  // Extrair texto de PDF
  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  };

  // Extrair texto de DOCX
  const extractTextFromDOCX = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome_analise || !formData.framework_id || !uploadedFile) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos e faça upload do documento.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Buscar informações do framework para cache
      const framework = frameworks?.find(f => f.id === formData.framework_id);

      // Extrair texto do documento baseado no tipo
      setIsExtracting(true);
      let textContent = '';
      const originalFileType = uploadedFile.type;
      
      try {
        if (originalFileType === 'application/pdf') {
          toast({
            title: "Extraindo texto do PDF...",
            description: "Isso pode levar alguns segundos.",
          });
          textContent = await extractTextFromPDF(uploadedFile);
        } else if (originalFileType.includes('wordprocessingml') || originalFileType === 'application/msword') {
          toast({
            title: "Extraindo texto do documento...",
            description: "Isso pode levar alguns segundos.",
          });
          textContent = await extractTextFromDOCX(uploadedFile);
        } else if (originalFileType === 'text/plain') {
          textContent = await uploadedFile.text();
        } else {
          throw new Error('Tipo de arquivo não suportado');
        }

        // Validar se o texto extraído tem conteúdo
        if (!textContent || textContent.trim().length < 100) {
          throw new Error('O documento não contém texto suficiente para análise. Verifique se o arquivo não está protegido ou corrompido.');
        }

        console.log(`Texto extraído: ${textContent.length} caracteres`);
      } catch (extractError: any) {
        console.error('Error extracting text:', extractError);
        toast({
          title: "Erro ao extrair texto",
          description: extractError.message || "Não foi possível extrair o texto do documento.",
          variant: "destructive"
        });
        return;
      } finally {
        setIsExtracting(false);
      }

      // Criar arquivo TXT com o texto extraído
      const originalFileName = uploadedFile.name.split('.').slice(0, -1).join('.');
      const txtFile = new File([textContent], `${originalFileName}.txt`, { type: 'text/plain' });
      const fileExt = 'txt';
      
      // Sanitizar nome do arquivo - remover espaços, acentos e caracteres especiais
      const sanitizedFileName = uploadedFile.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Substitui caracteres especiais por underscore
        .replace(/_{2,}/g, '_'); // Remove múltiplos underscores consecutivos
      
      const txtFileName = `${empresaId}/${Date.now()}_${sanitizedFileName.replace(/\.[^/.]+$/, '.txt')}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('adherence-documents')
        .upload(txtFileName, txtFile);

      if (uploadError) throw uploadError;

      // Obter URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('adherence-documents')
        .getPublicUrl(txtFileName);

      // Criar registro inicial com status "processando"
      const { data: assessment, error: insertError } = await supabase
        .from('gap_analysis_adherence_assessments')
        .insert([{
          empresa_id: empresaId,
          framework_id: formData.framework_id,
          documento_id: null, // Não vinculado a documento do sistema
          nome_analise: formData.nome_analise,
          descricao: formData.descricao || null,
          status: 'processando',
          framework_nome: framework?.nome,
          framework_versao: framework?.versao,
          documento_nome: uploadedFile.name,
          documento_tipo: fileExt,
          metadados_analise: {
            arquivo_storage: txtFileName,
            arquivo_url: publicUrl,
            arquivo_tamanho: txtFile.size,
            arquivo_original: uploadedFile.name,
            arquivo_original_tipo: originalFileType
          },
          created_by: user?.id
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Chamar edge function para processar a análise
      const { error: functionError } = await supabase.functions.invoke('analyze-document-adherence', {
        body: {
          assessmentId: assessment.id,
          frameworkId: formData.framework_id,
          storageFileName: txtFileName,
          empresaId
        }
      });

      if (functionError) {
        // Se a função falhar, atualizar status para erro
        await supabase
          .from('gap_analysis_adherence_assessments')
          .update({ status: 'erro', metadados_analise: { erro: functionError.message } })
          .eq('id', assessment.id);
        
        throw functionError;
      }

      toast({
        title: "Análise iniciada",
        description: "A avaliação de aderência está sendo processada. Isso pode levar alguns minutos.",
      });

      setFormData({
        nome_analise: '',
        descricao: '',
        framework_id: ''
      });
      setUploadedFile(null);

      onSuccess();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Error creating adherence assessment:', error);
      toast({
        title: "Erro ao iniciar análise",
        description: error.message || "Ocorreu um erro ao iniciar a avaliação.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Avaliação de Aderência</DialogTitle>
          <DialogDescription>
            Compare um documento interno com os requisitos de um framework regulatório usando IA
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome_analise">Nome da Avaliação *</Label>
            <Input
              id="nome_analise"
              value={formData.nome_analise}
              onChange={(e) => setFormData({ ...formData, nome_analise: e.target.value })}
              placeholder="Ex: Análise Política de Segurança vs ISO 27001"
              required
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva o objetivo desta avaliação..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="framework_id">Framework *</Label>
            <Select
              value={formData.framework_id}
              onValueChange={(value) => setFormData({ ...formData, framework_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o framework" />
              </SelectTrigger>
              <SelectContent>
                {loadingFrameworks ? (
                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
                ) : frameworks && frameworks.length > 0 ? (
                  frameworks.map((framework: any) => (
                    <SelectItem key={framework.id} value={framework.id}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {framework.nome} {framework.versao && `(${framework.versao})`}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>Nenhum framework cadastrado</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="documento">Documento *</Label>
            <div className="mt-2">
              {!uploadedFile ? (
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    id="documento"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="documento" className="cursor-pointer">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Clique para fazer upload</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, DOCX, DOC ou TXT (máx. 10MB)
                    </p>
                  </label>
                </div>
              ) : (
                <div className="border rounded-lg p-4 flex items-center justify-between bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Faça upload da política, procedimento ou documento que deseja avaliar
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || isExtracting || loadingFrameworks || !uploadedFile}>
              {(isSubmitting || isExtracting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isExtracting ? 'Extraindo texto...' : 'Iniciar Análise'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}