import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, Upload, FileText, FolderOpen, Eye, Download, Edit, Trash2, MessageSquare, CheckCircle, XCircle, Clock, History, Activity, Shield, Brain, BarChart3, TrendingUp, RefreshCw } from 'lucide-react';
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
import { RenovarDocumentoDialog } from '@/components/documentos/RenovarDocumentoDialog';
import { HistoricoVersoesDialog } from '@/components/documentos/HistoricoVersoesDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDocumentosStats } from '@/hooks/useDocumentosStats';
import ConfirmDialog from '@/components/ConfirmDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { capitalizeText, getStatusColor, getTipoColor, getClassificacaoColor } from '@/lib/text-utils';

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

export function Documentos() {
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
  
  // Buscar estatísticas dos documentos
  const { data: statsDocumentos } = useDocumentosStats();

  useEffect(() => {
    fetchDocumentos();
    fetchCategorias();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [documentos, searchTerm, selectedCategoria, selectedStatus, selectedTipo, filtrosAvancados]);

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

  const handleDeleteDocumento = (id: string) => {
    setDeleteConfirm({ open: true, documentoId: id });
  };

  const podeRenovar = (documento: Documento): boolean => {
    if (!documento.data_vencimento) return false;
    
    const hoje = new Date();
    const vencimento = new Date(documento.data_vencimento);
    const diasParaVencer = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    // Permitir renovação se vencido ou vencendo em até 30 dias
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { className: string; label: string }> = {
      'ativo': {
        className: 'border-green-500 bg-green-50 text-green-700',
        label: 'Ativo'
      },
      'inativo': {
        className: 'border-gray-500 bg-gray-50 text-gray-700',
        label: 'Inativo'
      },
      'arquivado': {
        className: 'border-blue-500 bg-blue-50 text-blue-700',
        label: 'Arquivado'
      },
      'pendente': {
        className: 'border-yellow-500 bg-yellow-50 text-yellow-700',
        label: 'Pendente'
      },
      'vencido': {
        className: 'border-red-500 bg-red-50 text-red-700',
        label: 'Vencido'
      }
    };

    const config = statusConfig[status] || statusConfig.ativo;

    return (
      <Badge className={`border ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  const getTipoBadge = (tipo: string) => {
    return (
      <Badge 
        variant="secondary" 
        className={`border ${getTipoColor(tipo)}`}
      >
        {capitalizeText(tipo)}
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
      key: 'classificacao',
      label: 'Classificação',
      render: (value: string) => value ? (
        <Badge 
          variant="secondary" 
          className={`border ${getClassificacaoColor(value)}`}
        >
          {capitalizeText(value)}
        </Badge>
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
      key: 'versao',
      label: 'Versão',
      render: (value: number) => `v${value}`
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
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
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
                <TableHead>Data de Criação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documentosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {filtrosAvancados || searchTerm || selectedCategoria !== 'all' || selectedStatus !== 'all' || selectedTipo !== 'all' 
                          ? 'Nenhum documento encontrado com os filtros aplicados.'
                          : 'Nenhum documento cadastrado.'
                        }
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                documentosFiltrados.map((documento) => (
                  <TableRow key={documento.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{documento.nome}</div>
                        {documento.descricao && (
                          <div className="text-sm text-muted-foreground">
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
                        className={`border ${getClassificacaoColor(documento.classificacao || 'interna')}`}
                      >
                        {capitalizeText(documento.classificacao || 'interna')}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(documento.status)}</TableCell>
                    <TableCell>v{documento.versao}</TableCell>
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
        // categorias removido - não é mais necessário
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
  );
}

export default Documentos;
