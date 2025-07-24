import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Server, Activity, AlertTriangle, TrendingUp, Wrench, History, Upload, ArrowUpDown, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAtivosStats } from '@/hooks/useAtivosStats';
import LocalizacaoSelect from '@/components/ativos/LocalizacaoSelect';
import ManutencaoDialog from '@/components/ativos/ManutencaoDialog';
import TrilhaAuditoriaAtivos from '@/components/ativos/TrilhaAuditoriaAtivos';
import ImportacaoAtivos from '@/components/ativos/ImportacaoAtivos';

interface Ativo {
  id: string;
  nome: string;
  tipo: string;
  descricao: string | null;
  proprietario: string | null;
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
  'servidor',
  'aplicacao',
  'banco_dados',
  'rede',
  'endpoint',
  'dispositivo_movel',
  'armazenamento',
  'software',
  'hardware',
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
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: stats, isLoading: statsLoading } = useAtivosStats();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
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
      const { data, error } = await supabase
        .from('ativos')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;
      setAtivos(data || []);
    } catch (error) {
      console.error('Error fetching ativos:', error);
      toast.error('Erro ao carregar ativos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.empresa_id) {
      toast.error('Usuário deve estar vinculado a uma empresa');
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
        toast.success('Ativo atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('ativos')
          .insert(ativoData);

        if (error) throw error;
        toast.success('Ativo criado com sucesso!');
      }

      setIsDialogOpen(false);
      setEditingAtivo(null);
      resetForm();
      fetchAtivos();
    } catch (error: any) {
      console.error('Error saving ativo:', error);
      toast.error(error.message || 'Erro ao salvar ativo');
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
      toast.success('Ativo excluído com sucesso!');
      fetchAtivos();
    } catch (error: any) {
      console.error('Error deleting ativo:', error);
      toast.error(error.message || 'Erro ao excluir ativo');
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

  const filteredAtivos = ativos.filter(ativo =>
    ativo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ativo.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ativo.proprietario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ativo.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ativo.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ativo.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Ativos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os ativos da organização
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setImportDialog(true)} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button onClick={() => setAuditDialog({open: true})} variant="outline">
            <History className="h-4 w-4 mr-2" />
            Auditoria
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingAtivo(null);
                resetForm();
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Ativo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingAtivo ? 'Editar Ativo' : 'Novo Ativo'}
                </DialogTitle>
                <DialogDescription>
                  {editingAtivo ? 'Atualize as informações do ativo' : 'Cadastre um novo ativo na plataforma'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                          <SelectItem key={tipo} value={tipo}>
                            {tipo.replace('_', ' ').charAt(0).toUpperCase() + tipo.replace('_', ' ').slice(1)}
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
                    <Input
                      id="proprietario"
                      value={formData.proprietario}
                      onChange={(e) => setFormData(prev => ({...prev, proprietario: e.target.value}))}
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
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ativos</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? '...' : stats?.total || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Críticos: {stats?.criticos || 0} | Altos: {stats?.altos || 0} | Médios: {stats?.medios || 0} | Baixos: {stats?.baixos || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.ativos || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Ativos: {stats?.ativos || 0} | Inativos: {stats?.inativos || 0} | Descontinuados: {stats?.descontinuados || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alto Valor</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.altoValorNegocio || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats?.percentualAltoValor || 0}% do total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.criticos || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Requerem atenção imediata
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca e Filtros */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ativos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Tabela de Ativos */}
      <Card>
        <CardHeader>
          <CardTitle>Ativos Registrados</CardTitle>
          <CardDescription>
            {filteredAtivos.length} de {ativos.length} ativo(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAtivos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhum ativo encontrado com o termo pesquisado' : 'Nenhum ativo cadastrado'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('nome')}>
                      <div className="flex items-center gap-1">
                        Nome
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('tipo')}>
                      <div className="flex items-center gap-1">
                        Tipo
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criticidade</TableHead>
                    <TableHead>Proprietário</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAtivos.map((ativo) => (
                    <TableRow key={ativo.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{ativo.nome}</div>
                          {ativo.tags && ativo.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {ativo.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {ativo.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{ativo.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ativo.tipo.replace('_', ' ').charAt(0).toUpperCase() + ativo.tipo.replace('_', ' ').slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(ativo.status) as any}>
                          {statusOptions.find(s => s.value === ativo.status)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getCriticidadeColor(ativo.criticidade) as any}>
                          {criticidades.find(c => c.value === ativo.criticidade)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{ativo.proprietario || '-'}</TableCell>
                      <TableCell>{ativo.localizacao || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setManutencaoDialog({open: true, ativoId: ativo.id, ativoNome: ativo.nome})}
                            title="Manutenções"
                          >
                            <Wrench className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(ativo)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(ativo.id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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