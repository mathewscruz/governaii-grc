import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Upload, X, CalendarIcon, File } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Documento {
  id: string;
  nome: string;
  descricao?: string;
  tipo: string;
  classificacao?: string;
  tags?: string[];
  arquivo_url?: string;
  arquivo_nome?: string;
  arquivo_tipo?: string;
  arquivo_tamanho?: number;
  versao: number;
  is_current_version: boolean;
  status: string;
  data_vencimento?: string;
  data_aprovacao?: string;
  aprovado_por?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Remover interface Categoria - não será mais usado

interface DocumentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documento?: Documento;
  onSuccess: () => void;
  // DocGen integration: optional prefill
  initialFile?: File | null;
  initialData?: Partial<{
    nome: string;
    descricao: string;
    tipo: string;
    classificacao: string;
    tags: string[];
    status: string;
    data_vencimento?: Date | undefined;
  }>;
}

export function DocumentoDialog({ open, onOpenChange, documento, onSuccess, initialFile, initialData }: DocumentoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'documento',
    classificacao: 'interna',
    tags: [] as string[],
    status: 'ativo',
    data_vencimento: undefined as Date | undefined,
  });
  const [newTag, setNewTag] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    let base = documento
      ? {
          nome: documento.nome,
          descricao: documento.descricao || '',
          tipo: documento.tipo,
          classificacao: documento.classificacao || 'interna',
          tags: documento.tags || [],
          status: documento.status,
          data_vencimento: documento.data_vencimento ? new Date(documento.data_vencimento) : undefined,
        }
      : {
          nome: '',
          descricao: '',
          tipo: 'documento',
          classificacao: 'interna',
          tags: [] as string[],
          status: 'ativo',
          data_vencimento: undefined as Date | undefined,
        };

    if (initialData) {
      base = {
        ...base,
        ...initialData,
        tags: initialData.tags ?? base.tags,
        data_vencimento: initialData.data_vencimento ?? base.data_vencimento,
      } as typeof base;
    }

    setFormData(base);
    setSelectedFile(initialFile || null);
    setNewTag('');
  }, [documento, open, initialFile, initialData]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    return filePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do documento.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('user_id', userData.user.id)
        .single();

      if (!profileData?.empresa_id) throw new Error('Empresa não encontrada');

      let arquivo_url = documento?.arquivo_url;
      let arquivo_nome = documento?.arquivo_nome;
      let arquivo_tipo = documento?.arquivo_tipo;
      let arquivo_tamanho = documento?.arquivo_tamanho;
      let versao = documento?.versao || 1;

      // Upload do arquivo se um novo foi selecionado
      if (selectedFile) {
        setUploading(true);
        arquivo_url = await uploadFile(selectedFile);
        arquivo_nome = selectedFile.name;
        arquivo_tipo = selectedFile.type;
        arquivo_tamanho = selectedFile.size;
        
        // Se estiver editando, incrementar versão
        if (documento) {
          versao = documento.versao + 1;
        }
      }

      const documentoData = {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || null,
        tipo: formData.tipo,
        classificacao: formData.classificacao,
        tags: formData.tags.length > 0 ? formData.tags : null,
        arquivo_url,
        arquivo_nome,
        arquivo_tipo,
        arquivo_tamanho,
        versao,
        status: formData.status,
        data_vencimento: formData.data_vencimento ? format(formData.data_vencimento, 'yyyy-MM-dd') : null,
        empresa_id: profileData.empresa_id,
        created_by: userData.user.id,
      };

      if (documento) {
        const { error } = await supabase
          .from('documentos')
          .update(documentoData)
          .eq('id', documento.id);

        if (error) throw error;

        toast({
          title: "Documento atualizado",
          description: "O documento foi atualizado com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from('documentos')
          .insert([documentoData]);

        if (error) throw error;

        toast({
          title: "Documento criado",
          description: "O documento foi criado com sucesso.",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      toast({
        title: "Erro ao salvar documento",
        description: error instanceof Error ? error.message : "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {documento ? 'Editar Documento' : 'Novo Documento'}
          </DialogTitle>
          <DialogDescription>
            {documento 
              ? 'Atualize as informações do documento.'
              : 'Adicione um novo documento ao sistema.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome do documento"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="documento">Documento</SelectItem>
                  <SelectItem value="politica">Política</SelectItem>
                  <SelectItem value="procedimento">Procedimento</SelectItem>
                  <SelectItem value="instrucao">Instrução</SelectItem>
                  <SelectItem value="formulario">Formulário</SelectItem>
                  <SelectItem value="certificado">Certificado</SelectItem>
                  <SelectItem value="contrato">Contrato</SelectItem>
                  <SelectItem value="relatorio">Relatório</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descrição do documento"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="classificacao">Classificação *</Label>
              <Select value={formData.classificacao} onValueChange={(value) => setFormData(prev => ({ ...prev, classificacao: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a classificação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="publica">Pública</SelectItem>
                  <SelectItem value="interna">Interna</SelectItem>
                  <SelectItem value="restrita">Restrita</SelectItem>
                  <SelectItem value="confidencial">Confidencial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="arquivado">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Adicionar tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Adicionar
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_vencimento">Data de Vencimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.data_vencimento && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.data_vencimento ? (
                    format(formData.data_vencimento, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.data_vencimento}
                  onSelect={(date) => setFormData(prev => ({ ...prev, data_vencimento: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Switch de confidencial removido - agora é gerenciado pela classificação */}

          <div className="space-y-2">
            <Label>Arquivo</Label>
            {documento?.arquivo_nome && !selectedFile && (
              <div className="flex items-center gap-2 p-2 border rounded">
                <File className="h-4 w-4" />
                <span className="text-sm">{documento.arquivo_nome}</span>
                <span className="text-xs text-muted-foreground">
                  (v{documento.versao} - {formatFileSize(documento.arquivo_tamanho || 0)})
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {selectedFile ? 'Trocar Arquivo' : documento ? 'Atualizar Arquivo' : 'Selecionar Arquivo'}
              </Button>
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 p-2 border rounded bg-muted">
                <File className="h-4 w-4" />
                <span className="text-sm">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({formatFileSize(selectedFile.size)})
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {uploading ? 'Enviando...' : 'Salvando...'}
                </>
              ) : (
                documento ? 'Atualizar' : 'Criar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}