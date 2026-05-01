import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, X, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface EvidenceFile {
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}

interface EvidenceUploadProps {
  requirementId: string;
  frameworkId: string;
  evidenceFiles: EvidenceFile[];
  onFilesUpdate: (files: EvidenceFile[]) => void;
}

export const EvidenceUpload: React.FC<EvidenceUploadProps> = ({
  requirementId,
  frameworkId,
  evidenceFiles,
  onFilesUpdate,
}) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Tipo de arquivo não permitido",
        description: "Apenas PDF, Word, imagens (JPEG, PNG) e arquivos de texto são permitidos."
      });
      return;
    }

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB."
      });
      return;
    }

    setUploading(true);

    try {
      // Upload para o bucket
      const fileName = `${frameworkId}/${requirementId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gap-analysis-evidences')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('gap-analysis-evidences')
        .getPublicUrl(fileName);

      const newFile: EvidenceFile = {
        name: file.name,
        url: urlData.publicUrl,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      };

      const updatedFiles = [...evidenceFiles, newFile];
      onFilesUpdate(updatedFiles);

      toast({
        title: "Evidência anexada",
        description: "Arquivo enviado com sucesso."
      });

    } catch (error) {
      logger.error('Erro no upload:', { error: error instanceof Error ? error.message : String(error) });
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: "Não foi possível enviar o arquivo."
      });
    } finally {
      setUploading(false);
      // Limpar input
      event.target.value = '';
    }
  };

  const handleFileDelete = async (fileToDelete: EvidenceFile) => {
    try {
      // Extrair path do arquivo da URL
      const url = new URL(fileToDelete.url);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(-3).join('/'); // frameworkId/requirementId/filename

      // Deletar do storage
      const { error } = await supabase.storage
        .from('gap-analysis-evidences')
        .remove([filePath]);

      if (error) throw error;

      const updatedFiles = evidenceFiles.filter(f => f.url !== fileToDelete.url);
      onFilesUpdate(updatedFiles);

      toast({
        title: "Evidência removida",
        description: "Arquivo removido com sucesso."
      });

    } catch (error) {
      logger.error('Erro ao deletar arquivo:', { error: error instanceof Error ? error.message : String(error) });
      toast({
        variant: "destructive",
        title: "Erro ao remover",
        description: "Não foi possível remover o arquivo."
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          type="file"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
          id={`evidence-${requirementId}`}
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById(`evidence-${requirementId}`)?.click()}
          disabled={uploading}
          className="flex items-center gap-1"
        >
          <Upload className="h-3 w-3" />
          {uploading ? 'Enviando...' : 'Anexar'}
        </Button>
      </div>

      {evidenceFiles.length > 0 && (
        <div className="space-y-1">
          {evidenceFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{file.name}</span>
                <span className="text-muted-foreground flex-shrink-0">
                  ({formatFileSize(file.size)})
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(file.url, '_blank')}
                  className="h-6 w-6 p-0"
                >
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileDelete(file)}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};