import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, Upload, FileText, FolderOpen, Eye, Download, Edit, Trash2, MessageSquare, CheckCircle, Clock, History, Activity, Shield, Brain, TrendingUp, RefreshCw, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
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
import { RenovarDocumentoDialog } from '@/components/documentos/RenovarDocumentoDialog';
import { HistoricoVersoesDialog } from '@/components/documentos/HistoricoVersoesDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDocumentosStats } from '@/hooks/useDocumentosStats';
import ConfirmDialog from '@/components/ConfirmDialog';
import { capitalizeText, getItemStatusColor, getTipoColor, getClassificacaoColor, formatStatus } from '@/lib/text-utils';
import { formatDateOnly } from '@/lib/date-utils';

interface Documento {
  id: string;
  empresa_id: string;
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
  requer_aprovacao?: boolean;
  status: string;
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

export default function Documentos() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [showFilters, setShowFilters] = useState(false);
  const [renovarDialog, setRenovarDialog] = useState<{ open: boolean; documento?: Documento }>({ open: false });
  const [historicoDialog, setHistoricoDialog] = useState<{ open: boolean; documento?: Documento }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; documentoId: string }>({
    open: false,
    documentoId: ''
  });
  const { toast } = useToast();
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Buscar estatísticas dos documentos
  const { data: statsDocumentos } = useDocumentosStats();

  useEffect(() => {
    fetchDocumentos();
    fetchCategorias();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [documentos, searchTerm, selectedCategoria, selectedStatus, selectedTipo, filtrosAvancados]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategoria, selectedStatus, selectedTipo, filtrosAvancados]);

  // Detectar se veio com itemId do dashboard
  useEffect(() => {
    const itemId = location.state?.itemId;
    if (itemId && documentos.length > 0) {
      const documento = documentos.find(d => d.id === itemId);
      if (documento) {
        setDocumentoDialog({ open: true, documento });
      }
    }
  }, [location.state, documentos]);

  // Detectar parâmetro de aprovação na URL (deep link do e-mail)
  useEffect(() => {
    const aprovarId = searchParams.get('aprovar');
    if (aprovarId && documentos.length > 0) {
      const documento = documentos.find(d => d.id === aprovarId);
      if (documento) {
        // Abrir o popup de aprovação automaticamente
        setAprovacaoDialog({ open: true, documento });
        // Limpar o parâmetro da URL para evitar reabrir em refresh
        searchParams.delete('aprovar');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, documentos, setSearchParams]);

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
      filtered = filtered.filter(doc => doc.classificacao === selectedCategoria);
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
        filtered = filtered.filter(doc => doc.classificacao === 'confidencial');
      }

      if (filtrosAvancados.comArquivo !== undefined) {
        if (filtrosAvancados.comArquivo) {
          filtered = filtered.filter(doc => doc.arquivo_url);
        } else {
          filtered = filtered.filter(doc => !doc.arquivo_url);
        }
      }

      if (filtrosAvancados.tamanhoMin) {
        const minBytes = filtrosAvancados.tamanhoMin * 1024 * 1024;
        filtered = filtered.filter(doc => 
          doc.arquivo_tamanho && doc.arquivo_tamanho >= minBytes
        );
      }

      if (filtrosAvancados.tamanhoMax) {
        const maxBytes = filtrosAvancados.tamanhoMax * 1024 * 1024;
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

  const handleDeleteDocumento = (id: string) => {
    setDeleteConfirm({ open: true, documentoId: id });
  };

  const podeRenovar = (documento: Documento): boolean => {
    if (!documento.data_vencimento) return false;
    
    const hoje = new Date();
    const vencimento = new Date(documento.data_vencimento);
    const diasParaVencer = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    return diasParaVencer <= 30;
  };

  const confirmDeleteDocumento = async () => {
    try {
      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', deleteConfirm.documentoId);

      if (error) throw error;

      toast({
        title: "Documento excluído",
        description: "O documento foi excluído com sucesso.",
      });

      fetchDocumentos();
      setDeleteConfirm({ open: false, documentoId: '' });
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

  const handleExportCSV = () => {
    const headers = ["Nome", "Tipo", "Classificação", "Status", "Versão", "Validade", "Data Criação"];
    const rows = documentosFiltrados.map(doc => [
      doc.nome,
      doc.tipo,
      doc.classificacao || "",
      doc.status,
      doc.versao,
      doc.data_vencimento ? formatDateOnly(doc.data_vencimento) : "",
      formatDateOnly(doc.created_at)
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.join(";"))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `documentos_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast({
      title: "Exportação concluída",
      description: "O arquivo CSV foi baixado com sucesso.",
    });
  };

  const getTipoBadge = (tipo: string) => {
    return (
      <Badge className={`border ${getTipoColor(tipo)} whitespace-nowrap`}>
        {capitalizeText(tipo)}
      </Badge>
    );
  };

  const getVencimentoBadge = (dataVencimento: string | null) => {
    if (!dataVencimento) return null;
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataVenc = new Date(dataVencimento + 'T00:00:00');
    const diffDays = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <Badge variant="destructive" className="ml-2 text-xs whitespace-nowrap">Vencido</Badge>;
    } else if (diffDays <= 30) {
      return <Badge variant="secondary" className="ml-2 text-xs bg-amber-100 text-amber-800 whitespace-nowrap">{diffDays}d</Badge>;
    }
    return null;
  };

  // Paginação
  const totalPages = Math.ceil(documentosFiltrados.length / itemsPerPage);

  const paginatedDocumentos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return documentosFiltrados.slice(start, start + itemsPerPage);
  }, [documentosFiltrados, currentPage, itemsPerPage]);

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
    <TooltipProvider>
      <div className="space-y-6">
          <PageHeader
          title="Documentos"
          description="Gerencie documentos, políticas e procedimentos da empresa de forma centralizada"
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Documentos"
            value={statsDocumentos?.total || 0}
            description={`${statsDocumentos?.ativos || 0} ativos`}
            icon={<FileText className="h-4 w-4" />}
            loading={!statsDocumentos}
          />

          <StatCard
            title="Aprovados"
            value={statsDocumentos?.aprovados || 0}
            description={`${statsDocumentos?.pendentesAprovacao || 0} pendentes`}
            icon={<CheckCircle className="h-4 w-4" />}
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

        {/* Tabela de documentos com estrutura integrada */}
        <Card className="rounded-lg border overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar documentos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={handleExportCSV}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Exportar CSV</TooltipContent>
                  </Tooltip>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setUploadMultiplos(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCategoriasDialog(true)}
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Categorias
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setBuscaAvancada(true)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Busca Avançada
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setRelatoriosDialog(true)}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Relatórios
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => setShowDocGenDialog(true)} 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    DocGen
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => setDocumentoDialog({ open: true })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo
                  </Button>
                </div>
              </div>
              
              {/* Filtros básicos */}
              {showFilters && (
                <div className="flex gap-4 items-center flex-wrap p-4 bg-muted/50 rounded-lg mb-4">
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

                  <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>

                  {(searchTerm || selectedCategoria !== 'all' || selectedStatus !== 'all' || selectedTipo !== 'all' || filtrosAvancados) && (
                    <Button variant="ghost" size="sm" onClick={limparFiltros}>
                      Limpar
                    </Button>
                  )}
                </div>
              )}

              {/* Indicador de filtros aplicados */}
              {filtrosAvancados && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Filter className="h-4 w-4" />
                  Filtros avançados aplicados
                  <Badge variant="secondary">
                    {Object.keys(filtrosAvancados).length} filtro(s)
                  </Badge>
                </div>
              )}
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Classificação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDocumentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <EmptyState
                        icon={<FileText className="h-8 w-8" />}
                        title={filtrosAvancados || searchTerm || selectedCategoria !== 'all' || selectedStatus !== 'all' || selectedTipo !== 'all' 
                          ? 'Nenhum documento encontrado'
                          : 'Nenhum documento cadastrado'}
                        description={filtrosAvancados || searchTerm || selectedCategoria !== 'all' || selectedStatus !== 'all' || selectedTipo !== 'all' 
                          ? 'Tente ajustar os filtros para encontrar o que procura.'
                          : 'Comece criando documentos para gerenciar suas políticas e procedimentos.'}
                        action={!filtrosAvancados && !searchTerm && selectedCategoria === 'all' && selectedStatus === 'all' && selectedTipo === 'all' ? {
                          label: 'Novo Documento',
                          onClick: () => setDocumentoDialog({ open: true })
                        } : undefined}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDocumentos.map((documento) => (
                    <TableRow key={documento.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{documento.nome}</div>
                          {documento.descricao && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {documento.descricao}
                            </div>
                          )}
                          {documento.classificacao === 'confidencial' && (
                            <Badge variant="destructive" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Confidencial
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getTipoBadge(documento.tipo)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={`border ${getClassificacaoColor(documento.classificacao || 'interna')} whitespace-nowrap`}
                        >
                          {capitalizeText(documento.classificacao || 'interna')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getItemStatusColor(documento.status)} border whitespace-nowrap`}>
                          {formatStatus(documento.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>v{documento.versao}</TableCell>
                      <TableCell>
                        <div className="flex items-center whitespace-nowrap">
                          {formatDateOnly(documento.data_vencimento)}
                          {getVencimentoBadge(documento.data_vencimento)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>Ações</TooltipContent>
                          </Tooltip>
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
                            <DropdownMenuSeparator />
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
                            {documento.requer_aprovacao && (
                              <DropdownMenuItem
                                onClick={() => setAprovacaoDialog({ open: true, documento })}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Aprovação
                              </DropdownMenuItem>
                            )}
                            {podeRenovar(documento) && (
                              <DropdownMenuItem
                                onClick={() => setRenovarDialog({ open: true, documento })}
                              >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Renovar Documento
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setHistoricoDialog({ open: true, documento })}
                            >
                              <History className="mr-2 h-4 w-4" />
                              Histórico de Versões
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setAuditoriaDialog({ open: true, documento })}
                            >
                              <Activity className="mr-2 h-4 w-4" />
                              Trilha de Auditoria
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
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
                  ))
                )}
              </TableBody>
            </Table>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <span className="text-sm text-muted-foreground">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, documentosFiltrados.length)} de {documentosFiltrados.length}
                </span>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let page = i + 1;
                      if (totalPages > 5) {
                        if (currentPage > 3) {
                          page = currentPage - 2 + i;
                        }
                        if (page > totalPages) {
                          page = totalPages - 4 + i;
                        }
                      }
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
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

        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
          title="Excluir Documento"
          description="Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita."
          confirmText="Excluir"
          variant="destructive"
          onConfirm={confirmDeleteDocumento}
        />

        <RenovarDocumentoDialog
          open={renovarDialog.open}
          onOpenChange={(open) => setRenovarDialog({ open, documento: undefined })}
          documento={renovarDialog.documento || null}
          onSuccess={fetchDocumentos}
        />

        <HistoricoVersoesDialog
          open={historicoDialog.open}
          onOpenChange={(open) => setHistoricoDialog({ open, documento: undefined })}
          documento={historicoDialog.documento || null}
        />
      </div>
    </TooltipProvider>
  );
}
