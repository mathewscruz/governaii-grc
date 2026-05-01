import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface EvidenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId: string;
  requirementId: string;
}

export const EvidenceDialog = ({
  open,
  onOpenChange,
  assessmentId,
  requirementId
}: EvidenceDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const [evidences, setEvidences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvidences = async () => {
    if (!requirementId) return;
    
    try {
      const { data, error } = await supabase
        .from('gap_analysis_evidences')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvidences(data || []);
    } catch (error) {
      logger.error('Erro ao buscar evidências:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    setLoading(true);
    fetchEvidences();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !requirementId) return;

    setIsUploading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `gap-analysis/${assessmentId}/${requirementId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gap-analysis-evidences')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get evaluation ID first
      let evaluationId = null;
      const { data: evaluationData } = await supabase
        .from('gap_analysis_evaluations')
        .select('id')
        .eq('assessment_id', assessmentId)
        .eq('requirement_id', requirementId)
        .single();
      
      if (evaluationData) {
        evaluationId = evaluationData.id;
      } else {
        // Create evaluation if it doesn't exist
        const { data: newEvaluation, error: evalError } = await supabase
          .from('gap_analysis_evaluations')
          .insert([{
            assessment_id: assessmentId,
            requirement_id: requirementId,
            status: 'nao_avaliado'
          }])
          .select()
          .single();
        
        if (evalError) throw evalError;
        evaluationId = newEvaluation.id;
      }

      // Create evidence record
      const { error: insertError } = await supabase
        .from('gap_analysis_evidences')
        .insert([{
          evaluation_id: evaluationId,
          nome: file.name,
          descricao: description,
          arquivo_nome: file.name,
          arquivo_url: filePath,
          arquivo_tamanho: file.size,
          arquivo_tipo: file.type
        }]);

      if (insertError) throw insertError;

      toast({
        title: "Evidência enviada",
        description: "A evidência foi enviada com sucesso.",
      });

      setFile(null);
      setDescription('');
      refetch();
    } catch (error) {
      logger.error('Erro ao enviar evidência:', { error: error instanceof Error ? error.message : String(error) });
      toast({
        title: "Erro ao enviar",
        description: "Ocorreu um erro ao enviar a evidência.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (evidenceId: string, filePath: string) => {
    try {
      // Delete file from storage
      const { error: deleteFileError } = await supabase.storage
        .from('gap-analysis-evidences')
        .remove([filePath]);

      if (deleteFileError) throw deleteFileError;

      // Delete evidence record
      const { error: deleteRecordError } = await supabase
        .from('gap_analysis_evidences')
        .delete()
        .eq('id', evidenceId);

      if (deleteRecordError) throw deleteRecordError;

      toast({
        title: "Evidência excluída",
        description: "A evidência foi excluída com sucesso.",
      });

      refetch();
    } catch (error) {
      logger.error('Erro ao excluir evidência:', { error: error instanceof Error ? error.message : String(error) });
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir a evidência.",
        variant: "destructive",
      });
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Evidências do Requisito</DialogTitle>
          <DialogDescription>
            Gerencie as evidências de conformidade para este requisito.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">Arquivo</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva a evidência..."
              />
            </div>

            <Button 
              onClick={handleUpload} 
              disabled={!file || isUploading}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Enviando...' : 'Enviar Evidência'}
            </Button>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Evidências Existentes</h4>
            {loading ? (
              <div>Carregando evidências...</div>
            ) : evidences && evidences.length > 0 ? (
              <div className="space-y-2">
                {evidences.map((evidence: any) => (
                  <Card key={evidence.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{evidence.nome}</div>
                            {evidence.descricao && (
                              <div className="text-sm text-muted-foreground">
                                {evidence.descricao}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {formatFileSize(evidence.arquivo_tamanho)} • {new Date(evidence.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(evidence.id, evidence.arquivo_url)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma evidência foi enviada ainda.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};