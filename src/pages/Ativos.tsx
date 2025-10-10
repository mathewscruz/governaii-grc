import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Server, Activity, AlertTriangle, TrendingUp, Wrench, History, Upload, ArrowUpDown, Download, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAtivosStats } from '@/hooks/useAtivosStats';
import LocalizacaoSelect from '@/components/ativos/LocalizacaoSelect';
import ManutencaoDialog from '@/components/ativos/ManutencaoDialog';
import TrilhaAuditoriaAtivos from '@/components/ativos/TrilhaAuditoriaAtivos';
import ImportacaoAtivos from '@/components/ativos/ImportacaoAtivos';
import { UserSelect } from '@/components/riscos/UserSelect';

interface Ativo {
  id: string;
  nome: string;
  tipo: string;
  descricao: string | null;
  proprietario: string | null;
  proprietario_nome?: string | null;
  proprietario_avatar?: string | null;
  localizacao: string | null;
  valor_negocio: string | null;
  criticidade: string;
  status: string;
  data_aquisicao: string | null;
  fornecedor: string | null;
  versao: string | null;
  tags: string[] | null;
  imei: string | null;
  cliente: string | null;
  quantidade: number | null;
  created_at: string;
}

const tiposAtivo = [
  // Tecnologia da Informação
  { value: 'servidor', label: 'Servidor' },
  { value: 'aplicacao', label: 'Aplicação' },
  { value: 'banco_dados', label: 'Banco de Dados' },
  { value: 'rede', label: 'Equipamento de Rede' },
  { value: 'endpoint', label: 'Endpoint' },
  { value: 'dispositivo_movel', label: 'Dispositivo Móvel' },
  { value: 'armazenamento', label: 'Armazenamento' },
  { value: 'software', label: 'Software' },
  { value: 'hardware', label: 'Hardware' },
  
  // Almoxarifado
  { value: 'almoxarifado_equipamento', label: 'Equipamento de Almoxarifado' },
  { value: 'almoxarifado_ferramenta', label: 'Ferramenta' },
  { value: 'almoxarifado_material', label: 'Material de Consumo' },
  { value: 'almoxarifado_epi', label: 'Equipamento de Proteção Individual' },
  
  // Escritório
  { value: 'mobiliario', label: 'Mobiliário' },
  { value: 'equipamento_escritorio', label: 'Equipamento de Escritório' },
  { value: 'equipamento_comunicacao', label: 'Equipamento de Comunicação' },
  { value: 'material_escritorio', label: 'Material de Escritório' },
  
  // Veículos e Transporte
  { value: 'veiculo_terrestre', label: 'Veículo Terrestre' },
  { value: 'veiculo_aereo', label: 'Veículo Aéreo' },
  { value: 'maquina_pesada', label: 'Máquina Pesada' },
  { value: 'equipamento_transporte', label: 'Equipamento de Transporte' },
  
  // Instalações e Infraestrutura
  { value: 'imovel', label: 'Imóvel' },
  { value: 'estrutura_fisica', label: 'Estrutura Física' },
  { value: 'instalacao_eletrica', label: 'Instalação Elétrica' },
  { value: 'instalacao_hidraulica', label: 'Instalação Hidráulica' },
  
  // Segurança
  { value: 'equipamento_seguranca', label: 'Equipamento de Segurança' },
  { value: 'sistema_monitoramento', label: 'Sistema de Monitoramento' },
  { value: 'controle_acesso', label: 'Controle de Acesso' },
  { value: 'equipamento_bombeiro', label: 'Equipamento de Combate a Incêndio' },
  
  // Produção e Operações
  { value: 'maquina_producao', label: 'Máquina de Produção' },
  { value: 'ferramenta_producao', label: 'Ferramenta de Produção' },
  { value: 'equipamento_medicao', label: 'Equipamento de Medição' },
  { value: 'equipamento_teste', label: 'Equipamento de Teste' },
  
  // Outros
  { value: 'equipamento_medico', label: 'Equipamento Médico' },
  { value: 'equipamento_laboratorio', label: 'Equipamento de Laboratório' },
  { value: 'outros', label: 'Outros' }
];

const criticidades = [
  { value: 'critico', label: 'Crítico', color: 'destructive' },
  { value: 'alto', label: 'Alto', color: 'warning' },
  { value: 'medio', label: 'Médio', color: 'default' },
  { value: 'baixo', label: 'Baixo', color: 'secondary' },
];

const statusOptions = [
  { value: 'ativo', label: 'Ativo', color: 'success' },
  { value: 'inativo', label: 'Inativo', color: 'secondary' },
  { value: 'descontinuado', label: 'Descontinuado', color: 'destructive' },
];

const valoresNegocio = ['alto', 'medio', 'baixo'];

const Ativos = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: stats, isLoading: statsLoading } = useAtivosStats();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    status: 'all',
    criticidade: 'all',
    tipo: 'all',
    valor_negocio: 'all',
    localizacao: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [manutencaoDialog, setManutencaoDialog] = useState<{open: boolean, ativoId: string, ativoNome: string}>({open: false, ativoId: '', ativoNome: ''});
  const [auditDialog, setAuditDialog] = useState<{open: boolean, ativoId?: string}>({open: false});
  const [importDialog, setImportDialog] = useState(false);
  const [editingAtivo, setEditingAtivo] = useState<Ativo | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; ativoId: string }>({
    open: false,
    ativoId: ''
  });
  const [formData, setFormData] = useState({
    nome: '',
    tipo: '',
    descricao: '',
    proprietario: '',
    localizacao: '',
    valor_negocio: '',
    criticidade: 'medio',
    status: 'ativo',
    data_aquisicao: '',
    fornecedor: '',
    versao: '',
    tags: '',
    imei: '',
    cliente: '',
    quantidade: 1,
  });

  useEffect(() => {
    fetchAtivos();
  }, [sortField, sortDirection]);

  const fetchAtivos = async () => {
    try {
      let query = supabase
        .from('ativos')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' });

      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch user names for proprietarios
      if (data && data.length > 0) {
        const proprietarioIds = data
          .map(a => a.proprietario)
          .filter(p => p !== null);
        
        if (proprietarioIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, nome')
            .in('user_id', proprietarioIds);
          
          const profileMap = new Map(
            profiles?.map(p => [p.user_id, { nome: p.nome }]) || []
          );
          
          const mappedData = data.map(ativo => {
            const profileData = ativo.proprietario ? profileMap.get(ativo.proprietario) : null;
            return {
              ...ativo,
              proprietario_nome: profileData?.nome || null
            };
          });
          
          setAtivos(mappedData);
        } else {
          setAtivos(data);
        }
      } else {
        setAtivos(data || []);
      }
    } catch (error) {
      console.error('Error fetching ativos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar ativos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.empresa_id) {
      toast({
        title: "Erro",
        description: "Usuário deve estar vinculado a uma empresa",
        variant: "destructive",
      });
      return;
    }

    try {
      const ativoData = {
        ...formData,
        empresa_id: profile.empresa_id,
        data_aquisicao: formData.data_aquisicao || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : null,
      };

      if (editingAtivo) {
        const { error } = await supabase
          .from('ativos')
          .update(ativoData)
          .eq('id', editingAtivo.id);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Ativo atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('ativos')
          .insert(ativoData);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Ativo criado com sucesso!",
        });
      }

      setIsDialogOpen(false);
      setEditingAtivo(null);
      resetForm();
      fetchAtivos();
    } catch (error: any) {
      console.error('Error saving ativo:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar ativo",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (ativo: Ativo) => {
    setEditingAtivo(ativo);
    setFormData({
      nome: ativo.nome,
      tipo: ativo.tipo,
      descricao: ativo.descricao || '',
      proprietario: ativo.proprietario || '',
      localizacao: ativo.localizacao || '',
      valor_negocio: ativo.valor_negocio || '',
      criticidade: ativo.criticidade,
      status: ativo.status,
      data_aquisicao: ativo.data_aquisicao || '',
      fornecedor: ativo.fornecedor || '',
      versao: ativo.versao || '',
      tags: ativo.tags ? ativo.tags.join(', ') : '',
      imei: ativo.imei || '',
      cliente: ativo.cliente || '',
      quantidade: ativo.quantidade || 1,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ open: true, ativoId: id });
  };

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from('ativos')
        .delete()
        .eq('id', deleteConfirm.ativoId);

      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Ativo excluído com sucesso!",
      });
      fetchAtivos();
    } catch (error: any) {
      console.error('Error deleting ativo:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir ativo",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: '',
      descricao: '',
      proprietario: '',
      localizacao: '',
      valor_negocio: '',
      criticidade: 'medio',
      status: 'ativo',
      data_aquisicao: '',
      fornecedor: '',
      versao: '',
      tags: '',
      imei: '',
      cliente: '',
      quantidade: 1,
    });
  };

  const filteredAtivos = ativos.filter(ativo => {
    // Filtro de busca por texto
    const matchesSearch = !searchTerm || 
      ativo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ativo.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ativo.proprietario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ativo.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ativo.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ativo.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtros específicos
    const matchesStatus = !filtros.status || filtros.status === 'all' || ativo.status === filtros.status;
    const matchesCriticidade = !filtros.criticidade || filtros.criticidade === 'all' || ativo.criticidade === filtros.criticidade;
    const matchesTipo = !filtros.tipo || filtros.tipo === 'all' || ativo.tipo === filtros.tipo;
    const matchesValorNegocio = !filtros.valor_negocio || filtros.valor_negocio === 'all' || ativo.valor_negocio === filtros.valor_negocio;
    const matchesLocalizacao = !filtros.localizacao || filtros.localizacao === 'all' || ativo.localizacao === filtros.localizacao;

    return matchesSearch && matchesStatus && matchesCriticidade && matchesTipo && matchesValorNegocio && matchesLocalizacao;
  });

  const clearFilters = () => {
    setFiltros({
      status: 'all',
      criticidade: 'all',
      tipo: 'all',
      valor_negocio: 'all',
      localizacao: 'all'
    });
    setSearchTerm('');
  };

  const hasActiveFilters = Object.values(filtros).some(f => f !== '' && f !== 'all') || searchTerm !== '';

  const getTipoLabel = (value: string) => {
    const tipo = tiposAtivo.find(t => t.value === value);
    return tipo?.label || value;
  };

  const getCriticidadeColor = (criticidade: string) => {
    const crit = criticidades.find(c => c.value === criticidade);
    return crit?.color || 'default';
  };

  const getStatusColor = (status: string) => {
    const stat = statusOptions.find(s => s.value === status);
    return stat?.color || 'default';
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Nome', 'Tipo', 'Status', 'Criticidade', 'Proprietário', 'Localização', 'Data Aquisição'].join(','),
      ...filteredAtivos.map(ativo => [
        ativo.nome,
        ativo.tipo,
        ativo.status,
        ativo.criticidade,
        ativo.proprietario || '',
        ativo.localizacao || '',
        ativo.data_aquisicao || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ativos-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const ativoColumns = [
    {
      key: 'nome',
      label: 'Nome',
      sortable: true,
      render: (value: string) => <span className="font-medium">{value}</span>
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (value: string) => getTipoLabel(value)
    },
    {
      key: 'criticidade',
      label: 'Criticidade',
      render: (value: string) => (
        <Badge variant={getCriticidadeColor(value) as any}>
          {criticidades.find(c => c.value === value)?.label || value}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <Badge variant={getStatusColor(value) as any}>
          {statusOptions.find(s => s.value === value)?.label || value}
        </Badge>
      )
    },
    {
      key: 'proprietario',
      label: 'Proprietário',
      render: (value: string, ativo: Ativo) => {
        if (!ativo.proprietario_nome) return '-';
        
        const initials = ativo.proprietario_nome
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{ativo.proprietario_nome}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
    },
    {
      key: 'localizacao',
      label: 'Localização',
      render: (value: string) => value || '-'
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (value: any, ativo: Ativo) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(ativo)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setManutencaoDialog({open: true, ativoId: ativo.id, ativoNome: ativo.nome})}
          >
            <Wrench className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(ativo.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const filters = [
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: statusOptions.map(status => ({ value: status.value, label: status.label })),
      value: filtros.status,
      onChange: (value: string) => setFiltros(prev => ({ ...prev, status: value }))
    },
    {
      key: 'criticidade',
      label: 'Criticidade',
      type: 'select' as const,
      options: criticidades.map(crit => ({ value: crit.value, label: crit.label })),
      value: filtros.criticidade,
      onChange: (value: string) => setFiltros(prev => ({ ...prev, criticidade: value }))
    },
    {
      key: 'tipo',
      label: 'Tipo',
      type: 'select' as const,
      options: tiposAtivo.map(tipo => ({ value: tipo.value, label: tipo.label })),
      value: filtros.tipo,
      onChange: (value: string) => setFiltros(prev => ({ ...prev, tipo: value }))
    },
    {
      key: 'valor_negocio',
      label: 'Valor de Negócio',
      type: 'select' as const,
      options: valoresNegocio.map(valor => ({ value: valor, label: valor.charAt(0).toUpperCase() + valor.slice(1) })),
      value: filtros.valor_negocio,
      onChange: (value: string) => setFiltros(prev => ({ ...prev, valor_negocio: value }))
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Ativos"
        description="Gerencie todos os ativos da organização de forma centralizada"
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>
                  {editingAtivo ? 'Editar Ativo' : 'Novo Ativo'}
                </DialogTitle>
                <DialogDescription>
                  {editingAtivo ? 'Atualize as informações do ativo' : 'Cadastre um novo ativo na plataforma'}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[calc(90vh-140px)]">
              <form onSubmit={handleSubmit} className="space-y-4 pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({...prev, nome: e.target.value}))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo *</Label>
                    <Select value={formData.tipo} onValueChange={(value) => setFormData(prev => ({...prev, tipo: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposAtivo.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({...prev, descricao: e.target.value}))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="proprietario">Proprietário</Label>
                    <UserSelect
                      value={formData.proprietario}
                      onValueChange={(value) => setFormData(prev => ({...prev, proprietario: value}))}
                      placeholder="Selecionar proprietário..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="localizacao">Localização</Label>
                    <LocalizacaoSelect
                      value={formData.localizacao}
                      onValueChange={(value) => setFormData(prev => ({...prev, localizacao: value}))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cliente">Cliente</Label>
                    <Input
                      id="cliente"
                      value={formData.cliente}
                      onChange={(e) => setFormData(prev => ({...prev, cliente: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imei">IMEI</Label>
                    <Input
                      id="imei"
                      value={formData.imei}
                      onChange={(e) => setFormData(prev => ({...prev, imei: e.target.value}))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData(prev => ({...prev, tags: e.target.value}))}
                      placeholder="Ex: servidor, crítico, backup (separadas por vírgula)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      min="1"
                      value={formData.quantidade}
                      onChange={(e) => setFormData(prev => ({...prev, quantidade: parseInt(e.target.value) || 1}))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="criticidade">Criticidade</Label>
                    <Select value={formData.criticidade} onValueChange={(value) => setFormData(prev => ({...prev, criticidade: value}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {criticidades.map((crit) => (
                          <SelectItem key={crit.value} value={crit.value}>
                            {crit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor_negocio">Valor de Negócio</Label>
                    <Select value={formData.valor_negocio} onValueChange={(value) => setFormData(prev => ({...prev, valor_negocio: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {valoresNegocio.map((valor) => (
                          <SelectItem key={valor} value={valor}>
                            {valor.charAt(0).toUpperCase() + valor.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({...prev, status: value}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_aquisicao">Data de Aquisição</Label>
                    <Input
                      id="data_aquisicao"
                      type="date"
                      value={formData.data_aquisicao}
                      onChange={(e) => setFormData(prev => ({...prev, data_aquisicao: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fornecedor">Fornecedor</Label>
                    <Input
                      id="fornecedor"
                      value={formData.fornecedor}
                      onChange={(e) => setFormData(prev => ({...prev, fornecedor: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="versao">Versão</Label>
                    <Input
                      id="versao"
                      value={formData.versao}
                      onChange={(e) => setFormData(prev => ({...prev, versao: e.target.value}))}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingAtivo ? 'Atualizar' : 'Criar'} Ativo
                  </Button>
                </div>
              </form>
              </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Ativos"
          value={stats?.total || 0}
          description={`Críticos: ${stats?.criticos || 0} | Altos: ${stats?.altos || 0}`}
          icon={<Server className="h-4 w-4 text-muted-foreground" />}
          variant={stats?.criticos ? "destructive" : "default"}
          loading={statsLoading}
        />

        <StatCard
          title="Ativos"
          value={stats?.ativos || 0}
          description={`${stats?.inativos || 0} inativos | ${stats?.descontinuados || 0} descontinuados`}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          variant="success"
          loading={statsLoading}
        />

        <StatCard
          title="Alto Valor"
          value={stats?.altoValorNegocio || 0}
          description={`${stats?.percentualAltoValor || 0}% do total`}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          variant="warning"
          loading={statsLoading}
        />

        <StatCard
          title="Criticidade Alta"
          value={(stats?.criticos || 0) + (stats?.altos || 0)}
          description="Requerem atenção especial"
          icon={<Shield className="h-4 w-4 text-muted-foreground" />}
          variant="info"
          loading={statsLoading}
        />
      </div>

      {/* Tabela de Ativos */}
      <Card className="rounded-lg border overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <Input
                placeholder="Buscar ativos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <div className="flex gap-2">
                <Button onClick={exportData} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <Button onClick={() => setImportDialog(true)} variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </Button>
                <Button onClick={() => setAuditDialog({open: true})} variant="outline" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  Auditoria
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
                <Button size="sm" onClick={() => {
                  setEditingAtivo(null);
                  resetForm();
                  setIsDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Ativo
                </Button>
              </div>
            </div>
            {showFilters && (
              <div className="flex gap-4 items-center flex-wrap p-4 bg-muted/50 rounded-lg">
                <Select value={filtros.status} onValueChange={(value) => setFiltros(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {statusOptions.map(status => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtros.criticidade} onValueChange={(value) => setFiltros(prev => ({ ...prev, criticidade: value }))}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Criticidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {criticidades.map(crit => (
                      <SelectItem key={crit.value} value={crit.value}>{crit.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtros.tipo} onValueChange={(value) => setFiltros(prev => ({ ...prev, tipo: value }))}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {tiposAtivo.map(tipo => (
                      <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Limpar Filtros
                  </Button>
                )}
              </div>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Criticidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Proprietário</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-muted rounded animate-pulse"></div></TableCell>
                  </TableRow>
                ))
              ) : filteredAtivos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      icon={<Server className="h-8 w-8" />}
                      title={searchTerm || hasActiveFilters
                        ? 'Nenhum ativo encontrado'
                        : 'Nenhum ativo cadastrado'}
                      description={searchTerm || hasActiveFilters
                        ? 'Tente ajustar os filtros para encontrar o que procura.'
                        : 'Comece cadastrando os ativos da sua organização.'}
                      action={!searchTerm && !hasActiveFilters ? {
                        label: 'Cadastrar Primeiro Ativo',
                        onClick: () => setIsDialogOpen(true)
                      } : undefined}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredAtivos.map((ativo) => (
                  <TableRow key={ativo.id}>
                    <TableCell>
                      <span className="font-medium">{ativo.nome}</span>
                    </TableCell>
                    <TableCell>
                      {getTipoLabel(ativo.tipo)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getCriticidadeColor(ativo.criticidade) as any}>
                        {criticidades.find(c => c.value === ativo.criticidade)?.label || ativo.criticidade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(ativo.status) as any}>
                        {statusOptions.find(s => s.value === ativo.status)?.label || ativo.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ativo.proprietario_nome ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Avatar className="h-8 w-8 cursor-pointer">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {ativo.proprietario_nome
                                    .split(' ')
                                    .map(n => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{ativo.proprietario_nome}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {ativo.localizacao || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(ativo)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setManutencaoDialog({open: true, ativoId: ativo.id, ativoNome: ativo.nome})}
                        >
                          <Wrench className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(ativo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        onConfirm={confirmDelete}
        title="Excluir Ativo"
        description="Tem certeza que deseja excluir este ativo? Esta ação não pode ser desfeita."
      />

      <ManutencaoDialog
        ativoId={manutencaoDialog.ativoId}
        ativoNome={manutencaoDialog.ativoNome}
        open={manutencaoDialog.open}
        onOpenChange={(open) => setManutencaoDialog({...manutencaoDialog, open})}
      />

      <TrilhaAuditoriaAtivos
        ativoId={auditDialog.ativoId}
        open={auditDialog.open}
        onOpenChange={(open) => setAuditDialog({...auditDialog, open})}
      />

      <ImportacaoAtivos
        open={importDialog}
        onOpenChange={setImportDialog}
        onSuccess={fetchAtivos}
      />

    </div>
  );
};

export default Ativos;