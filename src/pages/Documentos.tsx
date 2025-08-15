import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Upload, FileText, FolderOpen, Eye, Download, Edit, Trash2, MessageSquare, CheckCircle, XCircle, Clock, History, Activity, Shield, Brain, BarChart3, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { DocumentoDialog } from '@/components/documentos/DocumentoDialog';
import { CategoriasDialog } from '@/components/documentos/CategoriasDialog';
import { VinculacoesDialog } from '@/components/documentos/VinculacoesDialog';
import { AprovacaoDialog } from '@/components/documentos/AprovacaoDialog';
import { ComentariosDialog } from '@/components/documentos/ComentariosDialog';
import { DocumentosRelatorios } from '@/components/documentos/DocumentosRelatorios';
import { BuscaAvancadaDocumentos } from '@/components/documentos/BuscaAvancadaDocumentos';
import { UploadMultiplosDialog } from '@/components/documentos/UploadMultiplosDialog';
import { DocumentoPreview } from '@/components/documentos/DocumentoPreview';
import { TrilhaAuditoriaDocumentos } from '@/components/documentos/TrilhaAuditoriaDocumentos';
import { DocGenDialog } from '@/components/documentos/DocGenDialog';
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
  const [filtrosAvancados, setFiltrosAvancados] = useState<any>(null);
  const [showDocGenDialog, setShowDocGenDialog] = useState(false);
  const [relatoriosDialog, setRelatoriosDialog] = useState(false);
  const { toast } = useToast();
  
  // Buscar estatísticas dos documentos
  const { data: statsDocumentos } = useDocumentosStats();

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

  const documentoColumns = [
    {
      key: 'nome',
      label: 'Nome',
      sortable: true,
      render: (value: string, documento: Documento) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">
            v{documento.versao} • {documento.arquivo_nome || 'Sem arquivo'}
          </div>
        </div>
      )
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (value: string) => getTipoBadge(value)
    },
    {
      key: 'categoria',
      label: 'Categoria',
      render: (value: string) => value ? (
        <Badge variant="secondary">{value}</Badge>
      ) : '-'
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => getStatusBadge(value)
    },
    {
      key: 'data_vencimento',
      label: 'Vencimento',
      render: (value: string) => value 
        ? format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })
        : '-'
    },
    {
      key: 'confidencial',
      label: 'Confidencial',
      render: (value: boolean) => value ? (
        <Badge variant="destructive" className="gap-1">
          <Shield className="h-3 w-3" />
          Sim
        </Badge>
      ) : (
        <Badge variant="outline">Não</Badge>
      )
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (value: any, documento: Documento) => (
        <div className="flex items-center gap-2">
          {documento.arquivo_url && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewDialog({ open: true, documento })}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDocumentoDialog({ open: true, documento })}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteDocumento(documento.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const documentoFilters = [
    {
      key: 'categoria',
      label: 'Categoria',
      type: 'select' as const,
      options: categorias.map(cat => ({ value: cat.nome, label: cat.nome })),
      value: selectedCategoria,
      onChange: setSelectedCategoria
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'ativo', label: 'Ativo' },
        { value: 'inativo', label: 'Inativo' },
        { value: 'arquivado', label: 'Arquivado' },
        { value: 'vencido', label: 'Vencido' }
      ],
      value: selectedStatus,
      onChange: setSelectedStatus
    },
    {
      key: 'tipo',
      label: 'Tipo',
      type: 'select' as const,
      options: [
        { value: 'politica', label: 'Política' },
        { value: 'procedimento', label: 'Procedimento' },
        { value: 'instrucao', label: 'Instrução' },
        { value: 'formulario', label: 'Formulário' },
        { value: 'certificado', label: 'Certificado' },
        { value: 'contrato', label: 'Contrato' },
        { value: 'relatorio', label: 'Relatório' }
      ],
      value: selectedTipo,
      onChange: setSelectedTipo
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos"
        description="Gerencie documentos, políticas e procedimentos da empresa de forma centralizada"
        actions={
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
            <Button onClick={() => setShowDocGenDialog(true)} className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Brain className="h-4 w-4" />
              DocGen
            </Button>
            <Button onClick={() => setDocumentoDialog({ open: true })}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Documento
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Documentos"
          value={statsDocumentos?.total || 0}
          description={`${statsDocumentos?.ativos || 0} ativos`}
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          loading={!statsDocumentos}
        />

        <StatCard
          title="Aprovados"
          value={statsDocumentos?.aprovados || 0}
          description={`${statsDocumentos?.pendentesAprovacao || 0} pendentes`}
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
          variant="success"
          loading={!statsDocumentos}
        />

        <StatCard
          title="Vencendo em 30 dias"
          value={statsDocumentos?.vencendo30Dias || 0}
          description={`${statsDocumentos?.vencidos || 0} já vencidos`}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          variant={statsDocumentos?.vencendo30Dias ? "warning" : "default"}
          loading={!statsDocumentos}
        />

        <StatCard
          title="Confidenciais"
          value={statsDocumentos?.confidenciais || 0}
          description="Acesso restrito"
          icon={<Shield className="h-4 w-4 text-muted-foreground" />}
          variant="info"
          loading={!statsDocumentos}
        />
      </div>

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
        
        <Button
          variant="outline"
          onClick={() => setRelatoriosDialog(true)}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Relatórios
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

      <DocGenDialog
        open={showDocGenDialog}
        onOpenChange={setShowDocGenDialog}
        onDocumentSaved={() => {
          fetchDocumentos();
          setShowDocGenDialog(false);
        }}
      />

      <DocumentosRelatorios
        open={relatoriosDialog}
        onOpenChange={setRelatoriosDialog}
        documentos={documentos}
        categorias={categorias}
      />
    </div>
  );
}

export default Documentos;
