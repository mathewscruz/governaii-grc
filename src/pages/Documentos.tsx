import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Upload, FileText, FolderOpen, Eye, Download, Edit, Trash2, MessageSquare, CheckCircle, XCircle, Clock, History, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DocumentoDialog } from '@/components/documentos/DocumentoDialog';
import { CategoriasDialog } from '@/components/documentos/CategoriasDialog';
import { VinculacoesDialog } from '@/components/documentos/VinculacoesDialog';
import { AprovacaoDialog } from '@/components/documentos/AprovacaoDialog';
import { ComentariosDialog } from '@/components/documentos/ComentariosDialog';
import { DocumentosDashboard } from '@/components/documentos/DocumentosDashboard';
import { DocumentosRelatorios } from '@/components/documentos/DocumentosRelatorios';
import { BuscaAvancadaDocumentos } from '@/components/documentos/BuscaAvancadaDocumentos';
import { UploadMultiplosDialog } from '@/components/documentos/UploadMultiplosDialog';
import { DocumentoPreview } from '@/components/documentos/DocumentoPreview';
import { TrilhaAuditoriaDocumentos } from '@/components/documentos/TrilhaAuditoriaDocumentos';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDocumentosStats } from '@/hooks/useDocumentosStats';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Documento {
  id: string;
  nome: string;
  descricao?: string;
  tipo: string;
  categoria?: string;
  tags?: string[];
  arquivo_url?: string;
  arquivo_nome?: string;
  arquivo_tipo?: string;
  arquivo_tamanho?: number;
  versao: number;
  is_current_version: boolean;
  status: string;
  confidencial: boolean;
  data_vencimento?: string;
  data_aprovacao?: string;
  aprovado_por?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  cor: string;
}

export function Documentos() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [documentosFiltrados, setDocumentosFiltrados] = useState<Documento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTipo, setSelectedTipo] = useState<string>('all');
  const [documentoDialog, setDocumentoDialog] = useState<{ open: boolean; documento?: Documento }>({ open: false });
  const [categoriasDialog, setCategoriasDialog] = useState(false);
  const [vinculacoesDialog, setVinculacoesDialog] = useState<{ open: boolean; documento?: Documento }>({ open: false });
  const [aprovacaoDialog, setAprovacaoDialog] = useState<{ open: boolean; documento?: Documento }>({ open: false });
  const [comentariosDialog, setComentariosDialog] = useState<{ open: boolean; documento?: Documento }>({ open: false });
  const [previewDialog, setPreviewDialog] = useState<{ open: boolean; documento?: Documento }>({ open: false });
  const [auditoriaDialog, setAuditoriaDialog] = useState<{ open: boolean; documento?: Documento }>({ open: false });
  const [buscaAvancada, setBuscaAvancada] = useState(false);
  const [uploadMultiplos, setUploadMultiplos] = useState(false);
  const [activeTab, setActiveTab] = useState('lista');
  const [filtrosAvancados, setFiltrosAvancados] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDocumentos();
    fetchCategorias();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [documentos, searchTerm, selectedCategoria, selectedStatus, selectedTipo, filtrosAvancados]);

  const fetchDocumentos = async () => {
    try {
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocumentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      toast({
        title: "Erro ao carregar documentos",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('documentos_categorias')
        .select('*')
        .order('nome');

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const aplicarFiltros = () => {
    let filtered = [...documentos];

    // Filtro de busca simples
    if (searchTerm) {
      filtered = filtered.filter(documento => 
        documento.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        documento.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        documento.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtros básicos
    if (selectedCategoria !== 'all') {
      filtered = filtered.filter(doc => doc.categoria === selectedCategoria);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(doc => doc.status === selectedStatus);
    }

    if (selectedTipo !== 'all') {
      filtered = filtered.filter(doc => doc.tipo === selectedTipo);
    }

    // Filtros avançados
    if (filtrosAvancados) {
      if (filtrosAvancados.dataInicio) {
        filtered = filtered.filter(doc => 
          new Date(doc.created_at) >= filtrosAvancados.dataInicio
        );
      }

      if (filtrosAvancados.dataFim) {
        filtered = filtered.filter(doc => 
          new Date(doc.created_at) <= filtrosAvancados.dataFim
        );
      }

      if (filtrosAvancados.dataVencimentoInicio && filtrosAvancados.dataVencimentoInicio) {
        filtered = filtered.filter(doc => 
          doc.data_vencimento && 
          new Date(doc.data_vencimento) >= filtrosAvancados.dataVencimentoInicio
        );
      }

      if (filtrosAvancados.dataVencimentoFim) {
        filtered = filtered.filter(doc => 
          doc.data_vencimento && 
          new Date(doc.data_vencimento) <= filtrosAvancados.dataVencimentoFim
        );
      }

      if (filtrosAvancados.confidencial !== undefined) {
        filtered = filtered.filter(doc => doc.confidencial === filtrosAvancados.confidencial);
      }

      if (filtrosAvancados.comArquivo !== undefined) {
        if (filtrosAvancados.comArquivo) {
          filtered = filtered.filter(doc => doc.arquivo_url);
        } else {
          filtered = filtered.filter(doc => !doc.arquivo_url);
        }
      }

      if (filtrosAvancados.tamanhoMin) {
        const minBytes = filtrosAvancados.tamanhoMin * 1024 * 1024; // MB para bytes
        filtered = filtered.filter(doc => 
          doc.arquivo_tamanho && doc.arquivo_tamanho >= minBytes
        );
      }

      if (filtrosAvancados.tamanhoMax) {
        const maxBytes = filtrosAvancados.tamanhoMax * 1024 * 1024; // MB para bytes
        filtered = filtered.filter(doc => 
          doc.arquivo_tamanho && doc.arquivo_tamanho <= maxBytes
        );
      }

      if (filtrosAvancados.tags) {
        const searchTags = filtrosAvancados.tags.split(',').map((tag: string) => tag.trim().toLowerCase());
        filtered = filtered.filter(doc => 
          doc.tags && searchTags.some(searchTag => 
            doc.tags!.some(docTag => docTag.toLowerCase().includes(searchTag))
          )
        );
      }
    }

    setDocumentosFiltrados(filtered);
  };

  const handleDeleteDocumento = async (id: string) => {
    try {
      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Documento excluído",
        description: "O documento foi excluído com sucesso.",
      });

      fetchDocumentos();
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      toast({
        title: "Erro ao excluir documento",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  };

  const handleBuscaAvancada = (filtros: any) => {
    setFiltrosAvancados(filtros);
    toast({
      title: "Filtros aplicados",
      description: "Os filtros avançados foram aplicados com sucesso.",
    });
  };

  const limparFiltros = () => {
    setSearchTerm('');
    setSelectedCategoria('all');
    setSelectedStatus('all');
    setSelectedTipo('all');
    setFiltrosAvancados(null);
    toast({
      title: "Filtros limpos",
      description: "Todos os filtros foram removidos.",
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'ativo': 'default',
      'inativo': 'secondary',
      'arquivado': 'outline',
      'vencido': 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  const getTipoBadge = (tipo: string) => {
    const colors = {
      'politica': 'bg-blue-100 text-blue-800',
      'procedimento': 'bg-green-100 text-green-800',
      'instrucao': 'bg-yellow-100 text-yellow-800',
      'formulario': 'bg-purple-100 text-purple-800',
      'certificado': 'bg-red-100 text-red-800',
      'contrato': 'bg-indigo-100 text-indigo-800',
      'relatorio': 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {tipo}
      </Badge>
    );
  };

  const stats = {
    total: documentos.length,
    ativos: documentos.filter(d => d.status === 'ativo').length,
    vencidos: documentos.filter(d => d.data_vencimento && new Date(d.data_vencimento) < new Date()).length,
    pendentesAprovacao: documentos.filter(d => !d.data_aprovacao).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando documentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
          <p className="text-muted-foreground">
            Gerencie documentos, políticas e procedimentos da empresa
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setUploadMultiplos(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Múltiplo
          </Button>
          <Button
            variant="outline"
            onClick={() => setCategoriasDialog(true)}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Categorias
          </Button>
          <Button onClick={() => setDocumentoDialog({ open: true })}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Documento
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ativos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos Vencidos</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vencidos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes Aprovação</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendentesAprovacao}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="lista">Lista de Documentos</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          {/* Filtros */}
          <div className="flex gap-4 items-center flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.nome}>
                    {categoria.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="arquivado">Arquivado</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedTipo} onValueChange={setSelectedTipo}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="politica">Política</SelectItem>
                <SelectItem value="procedimento">Procedimento</SelectItem>
                <SelectItem value="instrucao">Instrução</SelectItem>
                <SelectItem value="formulario">Formulário</SelectItem>
                <SelectItem value="certificado">Certificado</SelectItem>
                <SelectItem value="contrato">Contrato</SelectItem>
                <SelectItem value="relatorio">Relatório</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => setBuscaAvancada(true)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Busca Avançada
            </Button>
            
            {(filtrosAvancados || searchTerm || selectedCategoria !== 'all' || selectedStatus !== 'all' || selectedTipo !== 'all') && (
              <Button
                variant="ghost"
                onClick={limparFiltros}
                className="text-muted-foreground"
              >
                Limpar Filtros
              </Button>
            )}
          </div>

          {/* Indicador de filtros aplicados */}
          {filtrosAvancados && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filtros avançados aplicados
              <Badge variant="secondary">
                {Object.keys(filtrosAvancados).length} filtro(s)
              </Badge>
            </div>
          )}

          {/* Tabela de documentos */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentosFiltrados.map((documento) => (
                  <TableRow key={documento.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{documento.nome}</div>
                        {documento.descricao && (
                          <div className="text-sm text-muted-foreground">
                            {documento.descricao}
                          </div>
                        )}
                        {documento.confidencial && (
                          <Badge variant="destructive" className="text-xs">
                            Confidencial
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getTipoBadge(documento.tipo)}</TableCell>
                    <TableCell>{documento.categoria || '-'}</TableCell>
                    <TableCell>{getStatusBadge(documento.status)}</TableCell>
                    <TableCell>v{documento.versao}</TableCell>
                    <TableCell>{formatFileSize(documento.arquivo_tamanho)}</TableCell>
                    <TableCell>
                      {format(new Date(documento.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setPreviewDialog({ open: true, documento })}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDocumentoDialog({ open: true, documento })}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setVinculacoesDialog({ open: true, documento })}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Vinculações
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setComentariosDialog({ open: true, documento })}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Comentários
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setAprovacaoDialog({ open: true, documento })}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Aprovação
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setAuditoriaDialog({ open: true, documento })}
                          >
                            <History className="mr-2 h-4 w-4" />
                            Auditoria
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteDocumento(documento.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {documentosFiltrados.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                {filtrosAvancados || searchTerm || selectedCategoria !== 'all' || selectedStatus !== 'all' || selectedTipo !== 'all' 
                  ? 'Nenhum documento encontrado com os filtros aplicados.'
                  : 'Nenhum documento cadastrado.'
                }
              </div>
            )}
          </Card>
        </TabsContent>


        <TabsContent value="dashboard">
          <DocumentosDashboard documentos={documentos} categorias={categorias} />
        </TabsContent>

        <TabsContent value="relatorios">
          <DocumentosRelatorios documentos={documentos} categorias={categorias} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <DocumentoDialog
        open={documentoDialog.open}
        onOpenChange={(open) => setDocumentoDialog({ open })}
        documento={documentoDialog.documento}
        onSuccess={() => {
          fetchDocumentos();
          setDocumentoDialog({ open: false });
        }}
        categorias={categorias}
      />

      <CategoriasDialog
        open={categoriasDialog}
        onOpenChange={setCategoriasDialog}
        onSuccess={fetchCategorias}
      />

      {vinculacoesDialog.documento && (
        <VinculacoesDialog
          open={vinculacoesDialog.open}
          onOpenChange={(open) => setVinculacoesDialog({ open })}
          documento={vinculacoesDialog.documento}
        />
      )}

      {aprovacaoDialog.documento && (
        <AprovacaoDialog
          open={aprovacaoDialog.open}
          onOpenChange={(open) => setAprovacaoDialog({ open })}
          documento={aprovacaoDialog.documento}
          onSuccess={fetchDocumentos}
        />
      )}

      {comentariosDialog.documento && (
        <ComentariosDialog
          open={comentariosDialog.open}
          onOpenChange={(open) => setComentariosDialog({ open })}
          documento={comentariosDialog.documento}
        />
      )}

      {previewDialog.documento && (
        <DocumentoPreview
          open={previewDialog.open}
          onOpenChange={(open) => setPreviewDialog({ open })}
          documento={previewDialog.documento}
        />
      )}

      {auditoriaDialog.documento && (
        <TrilhaAuditoriaDocumentos
          open={auditoriaDialog.open}
          onOpenChange={(open) => setAuditoriaDialog({ open })}
          documentoId={auditoriaDialog.documento.id}
          documentoNome={auditoriaDialog.documento.nome}
        />
      )}

      <BuscaAvancadaDocumentos
        open={buscaAvancada}
        onOpenChange={setBuscaAvancada}
        onSearch={handleBuscaAvancada}
        categorias={categorias}
      />

      <UploadMultiplosDialog
        open={uploadMultiplos}
        onOpenChange={setUploadMultiplos}
        onSuccess={fetchDocumentos}
        categorias={categorias}
      />
    </div>
  );
}

export default Documentos;
