import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Categoria {
  id: string;
  nome: string;
}

interface UploadMultiplosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  categorias: Categoria[];
}

export function UploadMultiplosDialog({ open, onOpenChange, onSuccess, categorias }: UploadMultiplosDialogProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione pelo menos um arquivo.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Simular upload - implementar lógica real aqui
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Upload concluído",
        description: `${files.length} arquivo(s) enviado(s) com sucesso.`,
      });

      onSuccess();
      onOpenChange(false);
      setFiles([]);
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Múltiplo de Documentos
          </DialogTitle>
          <DialogDescription>
            Selecione múltiplos arquivos para upload simultâneo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="multiple-files"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
            />
            <label htmlFor="multiple-files">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700">
                  Clique para selecionar arquivos
                </p>
                <p className="text-sm text-gray-500">
                  ou arraste e solte os arquivos aqui
                </p>
              </div>
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Arquivos selecionados ({files.length})</h3>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={uploading || files.length === 0}>
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enviando...
              </>
            ) : (
              `Enviar ${files.length} arquivo(s)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}