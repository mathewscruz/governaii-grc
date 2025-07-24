
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, DollarSign, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ConfirmDialog from '@/components/ConfirmDialog';
import { TratamentoDialog } from './TratamentoDialog';

interface Tratamento {
  id: string;
  tipo_tratamento: string;
  descricao: string;
  responsavel?: string;
  custo?: number;
  prazo?: string;
  data_inicio?: string;
  status: string;
  eficacia?: string;
  created_at: string;
}

interface TratamentosListProps {
  riscoId: string;
  riscoNome?: string;
  riscoData?: {
    nome: string;
    descricao: string;
    categoria?: string;
    nivel_risco_inicial?: string;
  };
}

export function TratamentosList({ riscoId, riscoNome, riscoData }: TratamentosListProps) {
  const [tratamentos, setTratamentos] = useState<Tratamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [tratamentoDialogOpen, setTratamentoDialogOpen] = useState(false);
  const [editingTratamento, setEditingTratamento] = useState<Tratamento | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tratamentoToDelete, setTratamentoToDelete] = useState<Tratamento | null>(null);

  const fetchTratamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('riscos_tratamentos')
        .select('*')
        .eq('risco_id', riscoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTratamentos(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar tratamentos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTratamentos();
  }, [riscoId]);

  const handleEdit = (tratamento: Tratamento) => {
    setEditingTratamento(tratamento);
    setTratamentoDialogOpen(true);
  };

  const openDeleteDialog = (tratamento: Tratamento) => {
    setTratamentoToDelete(tratamento);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!tratamentoToDelete) return;

    try {
      const { error } = await supabase
        .from('riscos_tratamentos')
        .delete()
        .eq('id', tratamentoToDelete.id);

      if (error) throw error;

      toast.success('Tratamento excluído com sucesso!');
      setDeleteDialogOpen(false);
      setTratamentoToDelete(null);
      fetchTratamentos();
    } catch (error: any) {
      toast.error('Erro ao excluir tratamento: ' + error.message);
    }
  };

  const openCreateDialog = () => {
    setEditingTratamento(null);
    setTratamentoDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    setTratamentoDialogOpen(false);
    setEditingTratamento(null);
    fetchTratamentos();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'secondary';
      case 'em andamento':
        return 'default';
      case 'concluído':
        return 'outline';
      case 'cancelado':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getTipoTratamentoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'mitigar':
        return 'default';
      case 'transferir':
        return 'secondary';
      case 'aceitar':
        return 'destructive';
      case 'evitar':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando tratamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Tratamentos do Risco</CardTitle>
            {riscoNome && (
              <p className="text-sm text-muted-foreground mt-1">
                Risco: <span className="font-medium">{riscoNome}</span>
              </p>
            )}
          </div>
          <Button onClick={openCreateDialog} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Novo Tratamento
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {tratamentos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhum tratamento cadastrado para este risco.
            </p>
            <Button onClick={openCreateDialog} className="mt-4" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Primeiro Tratamento
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tratamentos.map((tratamento) => (
                  <TableRow key={tratamento.id}>
                    <TableCell>
                      <Badge variant={getTipoTratamentoBadgeVariant(tratamento.tipo_tratamento)}>
                        {tratamento.tipo_tratamento}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={tratamento.descricao}>
                        {tratamento.descricao}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(tratamento.status)}>
                        {tratamento.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tratamento.responsavel ? (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {tratamento.responsavel}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tratamento.prazo ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(tratamento.prazo), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tratamento.custo ? (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(tratamento.custo)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(tratamento)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(tratamento)}
                        >
                          <Trash2 className="h-3 w-3" />
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

      <TratamentoDialog
        open={tratamentoDialogOpen}
        onOpenChange={setTratamentoDialogOpen}
        riscoId={riscoId}
        tratamento={editingTratamento}
        onSuccess={handleDialogSuccess}
        riscoData={riscoData}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Tratamento"
        description={`Tem certeza que deseja excluir este tratamento? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
      />
    </Card>
  );
}
