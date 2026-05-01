import React, { useState, useRef } from 'react';
import { Upload, Download, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { formatStatus } from '@/lib/text-utils';
import { StatusBadge } from '@/components/ui/status-badge';
import { resolveCriticidadeTone } from '@/lib/status-tone';

interface ImportacaoAtivosProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ImportedAtivo {
  nome: string;
  tipo: string;
  descricao?: string;
  proprietario?: string;
  localizacao?: string;
  valor_negocio?: string;
  criticidade: string;
  status: string;
  data_aquisicao?: string;
  fornecedor?: string;
  versao?: string;
  tags?: string;
  imei?: string;
  cliente?: string;
  quantidade?: number;
  valid: boolean;
  errors: string[];
  line: number;
}

const ImportacaoAtivos: React.FC<ImportacaoAtivosProps> = ({ open, onOpenChange, onSuccess }) => {
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'success'>('upload');
  const [importedData, setImportedData] = useState<ImportedAtivo[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [validCount, setValidCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  const tiposAtivo = [
    // Tecnologia da Informação
    'servidor', 'aplicacao', 'banco_dados', 'rede', 'endpoint', 'dispositivo_movel', 'armazenamento', 'software', 'hardware',
    // Almoxarifado
    'almoxarifado_equipamento', 'almoxarifado_ferramenta', 'almoxarifado_material', 'almoxarifado_epi',
    // Escritório
    'mobiliario', 'equipamento_escritorio', 'equipamento_comunicacao', 'material_escritorio',
    // Veículos e Transporte
    'veiculo_terrestre', 'veiculo_aereo', 'maquina_pesada', 'equipamento_transporte',
    // Instalações e Infraestrutura
    'imovel', 'estrutura_fisica', 'instalacao_eletrica', 'instalacao_hidraulica',
    // Segurança
    'equipamento_seguranca', 'sistema_monitoramento', 'controle_acesso', 'equipamento_bombeiro',
    // Produção e Operações
    'maquina_producao', 'ferramenta_producao', 'equipamento_medicao', 'equipamento_teste',
    // Outros
    'equipamento_medico', 'equipamento_laboratorio', 'outros'
  ];

  const criticidades = ['critico', 'alto', 'medio', 'baixo'];
  const statusOptions = ['ativo', 'inativo', 'descontinuado'];
  const valoresNegocio = ['alto', 'medio', 'baixo'];

  const downloadTemplate = () => {
    const template = [
      ['nome*', 'tipo*', 'descricao', 'proprietario', 'localizacao', 'valor_negocio', 'criticidade*', 'status*', 'data_aquisicao', 'fornecedor', 'versao', 'tags', 'imei', 'cliente', 'quantidade'],
      ['Servidor Web Principal', 'servidor', 'Servidor web para aplicação principal', 'TI', 'Data Center A', 'alto', 'critico', 'ativo', '2024-01-15', 'Dell', '1.0', 'web,critico', '', 'Cliente A', '1'],
      ['Notebook HP', 'hardware', 'Notebook para desenvolvimento', 'João Silva', 'Escritório SP', 'medio', 'medio', 'ativo', '2024-02-01', 'HP', '2.0', 'desenvolvimento', '', '', '1']
    ];

    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template-ativos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validateAtivo = (ativo: any, lineNumber: number): ImportedAtivo => {
    const errors: string[] = [];

    // Validações obrigatórias
    if (!ativo.nome?.trim()) errors.push('Nome é obrigatório');
    if (!ativo.tipo?.trim()) errors.push('Tipo é obrigatório');
    if (!ativo.criticidade?.trim()) errors.push('Criticidade é obrigatória');
    if (!ativo.status?.trim()) errors.push('Status é obrigatório');

    // Validações de valores permitidos
    if (ativo.tipo && !tiposAtivo.includes(ativo.tipo.toLowerCase())) {
      errors.push(`Tipo inválido. Valores permitidos: ${tiposAtivo.join(', ')}`);
    }
    if (ativo.criticidade && !criticidades.includes(ativo.criticidade.toLowerCase())) {
      errors.push(`Criticidade inválida. Valores permitidos: ${criticidades.join(', ')}`);
    }
    if (ativo.status && !statusOptions.includes(ativo.status.toLowerCase())) {
      errors.push(`Status inválido. Valores permitidos: ${statusOptions.join(', ')}`);
    }
    if (ativo.valor_negocio && !valoresNegocio.includes(ativo.valor_negocio.toLowerCase())) {
      errors.push(`Valor de negócio inválido. Valores permitidos: ${valoresNegocio.join(', ')}`);
    }

    // Validação de data
    if (ativo.data_aquisicao && ativo.data_aquisicao.trim()) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(ativo.data_aquisicao)) {
        errors.push('Data de aquisição deve estar no formato AAAA-MM-DD');
      }
    }

    // Validação de quantidade
    if (ativo.quantidade && isNaN(Number(ativo.quantidade))) {
      errors.push('Quantidade deve ser um número');
    }

    return {
      nome: ativo.nome?.trim() || '',
      tipo: ativo.tipo?.toLowerCase().trim() || '',
      descricao: ativo.descricao?.trim() || '',
      proprietario: ativo.proprietario?.trim() || '',
      localizacao: ativo.localizacao?.trim() || '',
      valor_negocio: ativo.valor_negocio?.toLowerCase().trim() || '',
      criticidade: ativo.criticidade?.toLowerCase().trim() || 'medio',
      status: ativo.status?.toLowerCase().trim() || 'ativo',
      data_aquisicao: ativo.data_aquisicao?.trim() || '',
      fornecedor: ativo.fornecedor?.trim() || '',
      versao: ativo.versao?.trim() || '',
      tags: ativo.tags?.trim() || '',
      imei: ativo.imei?.trim() || '',
      cliente: ativo.cliente?.trim() || '',
      quantidade: ativo.quantidade ? Number(ativo.quantidade) : 1,
      valid: errors.length === 0,
      errors,
      line: lineNumber
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        
        if (lines.length < 2) {
          toast.error('Arquivo deve conter pelo menos um cabeçalho e uma linha de dados');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace('*', ''));
        const data: ImportedAtivo[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const ativo: any = {};
          
          headers.forEach((header, index) => {
            ativo[header] = values[index] || '';
          });

          data.push(validateAtivo(ativo, i + 1));
        }

        setImportedData(data);
        setValidCount(data.filter(a => a.valid).length);
        setErrorCount(data.filter(a => !a.valid).length);
        setStep('preview');
      } catch (error) {
        toast.error('Erro ao processar arquivo. Verifique o formato CSV.');
      }
    };
    reader.readAsText(file);
  };

  const performImport = async () => {
    if (!profile?.empresa_id) {
      toast.error('Usuário deve estar vinculado a uma empresa');
      return;
    }

    setStep('importing');
    setImportProgress(0);

    const validAtivos = importedData.filter(ativo => ativo.valid);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < validAtivos.length; i++) {
      const ativo = validAtivos[i];
      
      try {
        const ativoData = {
          nome: ativo.nome,
          tipo: ativo.tipo,
          descricao: ativo.descricao || null,
          proprietario: ativo.proprietario || null,
          localizacao: ativo.localizacao || null,
          valor_negocio: ativo.valor_negocio || null,
          criticidade: ativo.criticidade,
          status: ativo.status,
          data_aquisicao: ativo.data_aquisicao || null,
          fornecedor: ativo.fornecedor || null,
          versao: ativo.versao || null,
          tags: ativo.tags ? ativo.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : null,
          imei: ativo.imei || null,
          cliente: ativo.cliente || null,
          quantidade: ativo.quantidade,
          empresa_id: profile.empresa_id,
        };

        const { error } = await supabase
          .from('ativos')
          .insert(ativoData);

        if (error) {
          console.error(`Erro ao importar ativo linha ${ativo.line}:`, error);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`Erro ao processar ativo linha ${ativo.line}:`, error);
        errorCount++;
      }

      setImportProgress(Math.round(((i + 1) / validAtivos.length) * 100));
    }

    setStep('success');
    
    if (successCount > 0) {
      toast.success(`${successCount} ativo(s) importado(s) com sucesso!`);
      onSuccess();
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} ativo(s) falharam na importação`);
    }
  };

  const resetImport = () => {
    setStep('upload');
    setImportedData([]);
    setImportProgress(0);
    setValidCount(0);
    setErrorCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importação em Massa de Ativos
          </DialogTitle>
          <DialogDescription>
            Importe múltiplos ativos usando um arquivo CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'upload' && (
            <div className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Formato obrigatório:</strong> O arquivo deve ser um CSV com campos separados por vírgula.
                  Campos obrigatórios: nome, tipo, criticidade, status.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">1. Download do Template</CardTitle>
                    <CardDescription>
                      Baixe o modelo com a estrutura correta
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={downloadTemplate} variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Template CSV
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">2. Upload do Arquivo</CardTitle>
                    <CardDescription>
                      Selecione o arquivo CSV preenchido
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Selecionar Arquivo CSV
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Campos Disponíveis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong>Obrigatórios:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>nome</li>
                        <li>tipo</li>
                        <li>criticidade</li>
                        <li>status</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Opcionais:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>descricao</li>
                        <li>proprietario</li>
                        <li>localizacao</li>
                        <li>valor_negocio</li>
                        <li>data_aquisicao</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Outros:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>fornecedor</li>
                        <li>versao</li>
                        <li>tags</li>
                        <li>imei</li>
                        <li>cliente</li>
                        <li>quantidade</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Preview da Importação</h3>
                  <p className="text-sm text-muted-foreground">
                    Revise os dados antes de importar
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">{validCount} válidos</Badge>
                  {errorCount > 0 && <Badge variant="destructive">{errorCount} com erro</Badge>}
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Linha</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Criticidade</TableHead>
                      <TableHead>Erros</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importedData.map((ativo, index) => (
                      <TableRow key={index}>
                        <TableCell>{ativo.line}</TableCell>
                        <TableCell>
                          {ativo.valid ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell>{ativo.nome}</TableCell>
                        <TableCell>{formatStatus(ativo.tipo)}</TableCell>
                        <TableCell>
                          <StatusBadge size="sm" {...resolveCriticidadeTone(ativo.criticidade)}>
                            {formatStatus(ativo.criticidade)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          {ativo.errors.length > 0 && (
                            <ul className="text-xs text-red-600">
                              {ativo.errors.map((error, i) => (
                                <li key={i}>• {error}</li>
                              ))}
                            </ul>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={resetImport}>
                  Voltar
                </Button>
                <Button 
                  onClick={performImport} 
                  disabled={validCount === 0}
                >
                  Importar {validCount} Ativo(s)
                </Button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="space-y-6 text-center">
              <div>
                <h3 className="text-lg font-semibold">Importando Ativos...</h3>
                <p className="text-sm text-muted-foreground">
                  Por favor, aguarde enquanto os ativos são importados
                </p>
              </div>
              <Progress value={importProgress} className="w-full" />
              <p className="text-sm">{importProgress}% concluído</p>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Importação Concluída!</h3>
                <p className="text-sm text-muted-foreground">
                  Os ativos foram importados com sucesso
                </p>
              </div>
              <Button onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportacaoAtivos;