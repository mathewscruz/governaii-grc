import { useState, useEffect } from 'react';
import { UserSelect } from '@/components/riscos/UserSelect';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, AlertTriangle, Shield, Database } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useIntegrationNotify } from '@/hooks/useIntegrationNotify';

const incidenteSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  tipo_incidente: z.string().min(1, 'Tipo de incidente é obrigatório'),
  categoria: z.string().optional(),
  criticidade: z.string().min(1, 'Criticidade é obrigatória'),
  data_ocorrencia: z.date().optional(),
  origem_deteccao: z.string().optional(),
  responsavel_deteccao: z.string().optional(),
  responsavel_tratamento: z.string().optional(),
  impacto_estimado: z.string().optional(),
  dados_afetados: z.string().optional(),
  sistemas_afetados: z.array(z.string()).optional(),
  ativos_afetados: z.array(z.string()).optional(),
  riscos_relacionados: z.array(z.string()).optional(),
});

type IncidenteFormData = z.infer<typeof incidenteSchema>;

interface IncidenteDialogProps {
  incidente?: any;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function IncidenteDialog({ incidente, onSuccess, trigger }: IncidenteDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ativos, setAtivos] = useState<any[]>([]);
  const [riscos, setRiscos] = useState<any[]>([]);
  const { toast } = useToast();
  const { notify } = useIntegrationNotify();

  const form = useForm<IncidenteFormData>({
    resolver: zodResolver(incidenteSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      tipo_incidente: 'seguranca',
      categoria: '',
      criticidade: 'media',
      origem_deteccao: '',
      responsavel_deteccao: '',
      responsavel_tratamento: '',
      impacto_estimado: '',
      dados_afetados: '',
      sistemas_afetados: [],
      ativos_afetados: [],
      riscos_relacionados: [],
    },
  });

  useEffect(() => {
    if (incidente) {
      form.reset({
        titulo: incidente.titulo || '',
        descricao: incidente.descricao || '',
        tipo_incidente: incidente.tipo_incidente || 'seguranca',
        categoria: incidente.categoria || '',
        criticidade: incidente.criticidade || 'media',
        data_ocorrencia: incidente.data_ocorrencia ? new Date(incidente.data_ocorrencia) : undefined,
        origem_deteccao: incidente.origem_deteccao || '',
        responsavel_deteccao: incidente.responsavel_deteccao || '',
        responsavel_tratamento: incidente.responsavel_tratamento || '',
        impacto_estimado: incidente.impacto_estimado || '',
        dados_afetados: incidente.dados_afetados || '',
        sistemas_afetados: incidente.sistemas_afetados || [],
        ativos_afetados: incidente.ativos_afetados || [],
        riscos_relacionados: incidente.riscos_relacionados || [],
      });
    }
  }, [incidente, form]);

  useEffect(() => {
    const loadAtivos = async () => {
      const { data } = await supabase.from('ativos').select('id, nome').order('nome');
      if (data) setAtivos(data);
    };

    const loadRiscos = async () => {
      const { data } = await supabase.from('riscos').select('id, nome').order('nome');
      if (data) setRiscos(data);
    };

    if (open) {
      loadAtivos();
      loadRiscos();
    }
  }, [open]);

  const onSubmit = async (data: IncidenteFormData) => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('user_id', userData.user?.id)
        .single();

      const incidenteData = {
        titulo: data.titulo!,
        descricao: data.descricao,
        tipo_incidente: data.tipo_incidente!,
        categoria: data.categoria,
        criticidade: data.criticidade!,
        data_ocorrencia: data.data_ocorrencia?.toISOString(),
        origem_deteccao: data.origem_deteccao,
        responsavel_deteccao: data.responsavel_deteccao || null,
        responsavel_tratamento: data.responsavel_tratamento || null,
        impacto_estimado: data.impacto_estimado,
        dados_afetados: data.dados_afetados,
        sistemas_afetados: data.sistemas_afetados,
        ativos_afetados: data.ativos_afetados,
        riscos_relacionados: data.riscos_relacionados,
        empresa_id: profile?.empresa_id!,
        created_by: userData.user?.id,
      };

      if (incidente) {
        const { error } = await supabase
          .from('incidentes')
          .update(incidenteData)
          .eq('id', incidente.id);

        if (error) throw error;
        toast({ title: 'Incidente atualizado com sucesso!' });
      } else {
        const { error } = await supabase
          .from('incidentes')
          .insert([incidenteData]);

        if (error) throw error;
        
        // Notificar integrações
        const gravidadeMap: Record<string, 'baixa' | 'media' | 'alta' | 'critica'> = {
          'baixa': 'baixa',
          'media': 'media',
          'alta': 'alta',
          'critica': 'critica'
        };
        
        await notify(
          data.criticidade === 'critica' ? 'incidente_critico' : 'incidente_criado',
          {
            titulo: `Novo Incidente: ${data.titulo}`,
            descricao: data.descricao || `Incidente de ${data.tipo_incidente} registrado`,
            link: `${window.location.origin}/incidentes`,
            gravidade: gravidadeMap[data.criticidade] || 'media',
            dados: { tipo: data.tipo_incidente, criticidade: data.criticidade }
          }
        );
        
        toast({ title: 'Incidente registrado com sucesso!' });
      }

      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const tipoIcons = {
    seguranca: Shield,
    privacidade: Database,
    disponibilidade: AlertTriangle,
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Incidente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {incidente ? 'Editar Incidente' : 'Registrar Novo Incidente'}
          </DialogTitle>
          <DialogDescription>
            {incidente ? 'Atualize as informações do incidente.' : 'Registre um novo incidente de segurança ou privacidade.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Título do Incidente *</FormLabel>
                    <FormControl>
                      <Input placeholder="Descreva brevemente o incidente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_incidente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Incidente *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="seguranca">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Segurança da Informação
                          </div>
                        </SelectItem>
                        <SelectItem value="privacidade">
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Privacidade de Dados
                          </div>
                        </SelectItem>
                        <SelectItem value="disponibilidade">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Disponibilidade
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="criticidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Criticidade *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a criticidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="critica">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Malware, Phishing, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_ocorrencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Ocorrência</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
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
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição Detalhada</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva detalhadamente o incidente, como foi descoberto e quais ações imediatas foram tomadas..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="origem_deteccao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem da Detecção</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Monitoramento, Usuário, Auditoria..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsavel_deteccao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável pela Detecção</FormLabel>
                    <FormControl>
                      <UserSelect
                        value={field.value || ''}
                        onValueChange={field.onChange}
                        placeholder="Selecionar responsável..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsavel_tratamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável pelo Tratamento</FormLabel>
                    <FormControl>
                      <UserSelect
                        value={field.value || ''}
                        onValueChange={field.onChange}
                        placeholder="Selecionar responsável..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="impacto_estimado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impacto Estimado</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Dados comprometidos, sistema indisponível..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dados_afetados"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dados Afetados</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva quais tipos de dados foram afetados (pessoais, financeiros, etc.)"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : incidente ? 'Atualizar' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}