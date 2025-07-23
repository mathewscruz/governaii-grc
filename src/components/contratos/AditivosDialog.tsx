
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Plus, Edit, Trash2, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ConfirmDialog from '@/components/ConfirmDialog';

const aditivoSchema = z.object({
  numero_aditivo: z.string().min(1, 'Número do aditivo é obrigatório'),
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  motivo: z.string().min(1, 'Motivo é obrigatório'),
  valor_anterior: z.string().optional(),
  valor_novo: z.string().optional(),
  data_inicio_anterior: z.date().optional(),
  data_fim_anterior: z.date().optional(),
  data_inicio_nova: z.date().optional(),
  data_fim_nova: z.date().optional(),
  data_assinatura: z.date().optional(),
  justificativa: z.string().min(1, 'Justificativa é obrigatória'),
  status: z.string().default('rascunho'),
});

type AditivoFormData = z.infer<typeof aditivoSchema>;

interface Aditivo {
  id: string;
  contrato_id: string;
  numero_aditivo: string;
  tipo: string;
  motivo: string;
  valor_anterior: number | null;
  valor_novo: number | null;
  data_inicio_anterior: string | null;
  data_fim_anterior: string | null;
  data_inicio_nova: string | null;
  data_fim_nova: string | null;
  data_assinatura: string | null;
  status: string;
  justificativa: string;
  aprovado_por: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface Contrato {
  id: string;
  nome: string;
  numero_contrato: string;
  valor: number | null;
  data_inicio: string | null;
  data_fim: string | null;
}

interface AditivosDialogProps {
  contrato: Contrato | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AditivosDialog: React.FC<AditivosDialogProps> = ({
  contrato,
  open,
  onOpenChange,
}) => {
  const [aditivos, setAditivos] = useState<Aditivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAditivo, setEditingAditivo] = useState<Aditivo | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [aditivoToDelete, setAditivoToDelete] = useState<Aditivo | null>(null);
  const { toast } = useToast();

  const form = useForm<AditivoFormData>({
    resolver: zodResolver(aditivoSchema),
    defaultValues: {
      numero_aditivo: '',
      tipo: '',
      motivo: '',
      valor_anterior: '',
      valor_novo: '',
      justificativa: '',
      status: 'rascunho',
    },
  });

  useEffect(() => {
    if (open && contrato) {
      fetchAditivos();
    }
  }, [open, contrato]);

  useEffect(() => {
    if (editingAditivo) {
      form.reset({
        numero_aditivo: editingAditivo.numero_aditivo,
        tipo: editingAditivo.tipo,
        motivo: editingAditivo.motivo,
        valor_anterior: editingAditivo.valor_anterior?.toString() || '',
        valor_novo: editingAditivo.valor_novo?.toString() || '',
        data_inicio_anterior: editingAditivo.data_inicio_anterior ? new Date(editingAditivo.data_inicio_anterior) : undefined,
        data_fim_anterior: editingAditivo.data_fim_anterior ? new Date(editingAditivo.data_fim_anterior) : undefined,
        data_inicio_nova: editingAditivo.data_inicio_nova ? new Date(editingAditivo.data_inicio_nova) : undefined,
        data_fim_nova: editingAditivo.data_fim_nova ? new Date(editingAditivo.data_fim_nova) : undefined,
        data_assinatura: editingAditivo.data_assinatura ? new Date(editingAditivo.data_assinatura) : undefined,
        justificativa: editingAditivo.justificativa,
        status: editingAditivo.status,
      });
    } else {
      form.reset({
        numero_aditivo: '',
        tipo: '',
        motivo: '',
        valor_anterior: contrato?.valor?.toString() || '',
        valor_novo: '',
        data_inicio_anterior: contrato?.data_inicio ? new Date(contrato.data_inicio) : undefined,
        data_fim_anterior: contrato?.data_fim ? new Date(contrato.data_fim) : undefined,
        justificativa: '',
        status: 'rascunho',
      });
    }
  }, [editingAditivo, contrato, form]);

  const fetchAditivos = async () => {
    if (!contrato) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contrato_aditivos')
        .select('*')
        .eq('contrato_id', contrato.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAditivos(data || []);
    } catch (error) {
      console.error('Erro ao carregar aditivos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar aditivos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: AditivoFormData) => {
    if (!contrato) return;

    try {
      setLoading(true);

      const aditivoData = {
        contrato_id: contrato.id,
        numero_aditivo: data.numero_aditivo,
        tipo: data.tipo,
        motivo: data.motivo,
        valor_anterior: data.valor_anterior ? parseFloat(data.valor_anterior) : null,
        valor_novo: data.valor_novo ? parseFloat(data.valor_novo) : null,
        data_inicio_anterior: data.data_inicio_anterior?.toISOString().split('T')[0] || null,
        data_fim_anterior: data.data_fim_anterior?.toISOString().split('T')[0] || null,
        data_inicio_nova: data.data_inicio_nova?.toISOString().split('T')[0] || null,
        data_fim_nova: data.data_fim_nova?.toISOString().split('T')[0] || null,
        data_assinatura: data.data_assinatura?.toISOString().split('T')[0] || null,
        justificativa: data.justificativa,
        status: data.status,
      };

      let error;
      if (editingAditivo) {
        const result = await supabase
          .from('contrato_aditivos')
          .update(aditivoData)
          .eq('id', editingAditivo.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('contrato_aditivos')
          .insert([aditivoData]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Aditivo ${editingAditivo ? 'atualizado' : 'criado'} com sucesso`,
      });

      setShowForm(false);
      setEditingAditivo(null);
      form.reset();
      fetchAditivos();
    } catch (error) {
      console.error('Erro ao salvar aditivo:', error);
      toast({
        title: "Erro",
        description: `Erro ao ${editingAditivo ? 'atualizar' : 'criar'} aditivo`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!aditivoToDelete) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('contrato_aditivos')
        .delete()
        .eq('id', aditivoToDelete.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Aditivo excluído com sucesso",
      });

      fetchAditivos();
    } catch (error) {
      console.error('Erro ao excluir aditivo:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir aditivo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
      setAditivoToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      rascunho: { color: 'bg-gray-500', label: 'Rascunho', icon: FileText },
      aprovacao: { color: 'bg-blue-500', label: 'Em Aprovação', icon: Clock },
      ativo: { color: 'bg-green-500', label: 'Ativo', icon: CheckCircle },
      rejeitado: { color: 'bg-red-500', label: 'Rejeitado', icon: XCircle },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { color: 'bg-gray-500', label: status, icon: FileText };
    const IconComponent = statusInfo.icon;
    
    return (
      <Badge className={`${statusInfo.color} text-white flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!contrato) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aditivos Contratuais</DialogTitle>
            <DialogDescription>
              Gerencie os aditivos do contrato: {contrato.nome} ({contrato.numero_contrato})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {!showForm ? (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Lista de Aditivos</h3>
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Aditivo
                  </Button>
                </div>

                {aditivos.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhum aditivo encontrado</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {aditivos.map((aditivo) => (
                          <TableRow key={aditivo.id}>
                            <TableCell className="font-medium">{aditivo.numero_aditivo}</TableCell>
                            <TableCell className="capitalize">{aditivo.tipo}</TableCell>
                            <TableCell>{aditivo.motivo}</TableCell>
                            <TableCell>
                              {aditivo.valor_anterior && aditivo.valor_novo ? (
                                <div className="text-sm">
                                  <div>De: {formatCurrency(aditivo.valor_anterior)}</div>
                                  <div>Para: {formatCurrency(aditivo.valor_novo)}</div>
                                </div>
                              ) : (
                                'N/A'
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(aditivo.status)}</TableCell>
                            <TableCell>
                              {aditivo.data_assinatura 
                                ? format(new Date(aditivo.data_assinatura), 'dd/MM/yyyy', { locale: ptBR })
                                : 'Não assinado'
                              }
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingAditivo(aditivo);
                                    setShowForm(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setAditivoToDelete(aditivo);
                                    setDeleteConfirmOpen(true);
                                  }}
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
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>{editingAditivo ? 'Editar Aditivo' : 'Novo Aditivo'}</CardTitle>
                  <CardDescription>
                    Preencha as informações do aditivo contratual
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="numero_aditivo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número do Aditivo</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 001/2024" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tipo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="prazo">Prazo</SelectItem>
                                <SelectItem value="valor">Valor</SelectItem>
                                <SelectItem value="escopo">Escopo</SelectItem>
                                <SelectItem value="outros">Outros</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="motivo"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Motivo</FormLabel>
                            <FormControl>
                              <Input placeholder="Descreva o motivo do aditivo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="valor_anterior"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Anterior</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="valor_novo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Novo</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="data_inicio_anterior"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Início Anterior</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                    ) : (
                                      <span>Selecione a data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="data_fim_anterior"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Fim Anterior</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                    ) : (
                                      <span>Selecione a data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="data_inicio_nova"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Início Nova</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                    ) : (
                                      <span>Selecione a data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="data_fim_nova"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Fim Nova</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                    ) : (
                                      <span>Selecione a data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="data_assinatura"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Assinatura</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                    ) : (
                                      <span>Selecione a data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="rascunho">Rascunho</SelectItem>
                                <SelectItem value="aprovacao">Em Aprovação</SelectItem>
                                <SelectItem value="ativo">Ativo</SelectItem>
                                <SelectItem value="rejeitado">Rejeitado</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="justificativa"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Justificativa</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Descreva detalhadamente a justificativa para este aditivo..."
                                className="min-h-20"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="md:col-span-2 flex gap-2 justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowForm(false);
                            setEditingAditivo(null);
                            form.reset();
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                          {loading ? 'Salvando...' : editingAditivo ? 'Atualizar' : 'Criar'} Aditivo
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Confirmar Exclusão"
        description={`Tem certeza que deseja excluir o aditivo "${aditivoToDelete?.numero_aditivo}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
};
