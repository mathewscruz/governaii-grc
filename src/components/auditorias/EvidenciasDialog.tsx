import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Plus, Trash2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EvidenciasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditoria?: any;
}

const EvidenciasDialog = ({ open, onOpenChange, auditoria }: EvidenciasDialogProps) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: '',
    trabalho_id: '',
    achado_id: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: evidencias, refetch } = useQuery({
    queryKey: ['auditoria-evidencias', auditoria?.id],
    queryFn: async () => {
      if (!auditoria?.id) return [];
      
      const { data, error } = await supabase
        .from('auditoria_evidencias')
        .select('*')
        .eq('auditoria_id', auditoria.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!auditoria?.id
  });

  const handleFileUpload = async (file: File) => {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${auditoria.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('auditoria-evidencias')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('auditoria-evidencias')
      .getPublicUrl(filePath);

    return { url: publicUrl, fileName, filePath };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let arquivo_url = '';
      let arquivo_nome = '';
      let arquivo_tamanho = 0;
      let arquivo_tipo = '';

      if (selectedFile) {
        const { url, fileName } = await handleFileUpload(selectedFile);
        arquivo_url = url;
        arquivo_nome = fileName;
        arquivo_tamanho = selectedFile.size;
        arquivo_tipo = selectedFile.type;
      }

      const evidenciaData = {
        ...formData,
        auditoria_id: auditoria.id,
        trabalho_id: formData.trabalho_id || null,
        achado_id: formData.achado_id || null,
        arquivo_url,
        arquivo_nome,
        arquivo_tamanho,
        arquivo_tipo
      };

      const { error } = await supabase
        .from('auditoria_evidencias')
        .insert(evidenciaData);

      if (error) throw error;

      toast.success('Evidência criada com sucesso');
      setShowForm(false);
      setFormData({
        nome: '',
        descricao: '',
        tipo: '',
        trabalho_id: '',
        achado_id: ''
      });
      setSelectedFile(null);
      refetch();
    } catch (error) {
      toast.error('Erro ao salvar evidência');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, arquivo_url?: string) => {
    if (!confirm('Tem certeza que deseja excluir esta evidência?')) return;

    try {
      const { error } = await supabase
        .from('auditoria_evidencias')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Evidência excluída com sucesso');
      refetch();
    } catch (error) {
      toast.error('Erro ao excluir evidência');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Evidências - {auditoria?.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Evidência
          </Button>

          {showForm && (
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome da Evidência *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo *</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="documento">Documento</SelectItem>
                          <SelectItem value="screenshot">Screenshot</SelectItem>
                          <SelectItem value="planilha">Planilha</SelectItem>
                          <SelectItem value="foto">Foto</SelectItem>
                          <SelectItem value="video">Vídeo</SelectItem>
                          <SelectItem value="audio">Áudio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="arquivo">Arquivo</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        id="arquivo"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <label htmlFor="arquivo" className="cursor-pointer">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          {selectedFile ? selectedFile.name : 'Clique para selecionar um arquivo'}
                        </p>
                        {selectedFile && (
                          <p className="text-xs text-gray-500">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={uploading}>
                      {uploading ? 'Enviando...' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {evidencias?.map((evidencia) => (
              <Card key={evidencia.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{evidencia.nome}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge>{evidencia.tipo}</Badge>
                        {evidencia.arquivo_tamanho && (
                          <Badge variant="outline">
                            {formatFileSize(evidencia.arquivo_tamanho)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {evidencia.arquivo_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(evidencia.arquivo_url, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(evidencia.id, evidencia.arquivo_url)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {evidencia.descricao && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {evidencia.descricao}
                    </p>
                  )}
                  {evidencia.arquivo_nome && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Arquivo:</strong> {evidencia.arquivo_nome}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Criado em: {new Date(evidencia.created_at).toLocaleString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {evidencias?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma evidência cadastrada para esta auditoria.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EvidenciasDialog;