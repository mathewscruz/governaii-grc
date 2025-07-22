
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

const tratamentoSchema = z.object({
  tipo_tratamento: z.string().min(1, 'Tipo de tratamento é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  responsavel: z.string().optional(),
  custo: z.string().optional(),
  prazo: z.date().optional(),
  data_inicio: z.date().optional(),
  status: z.string().default('pendente'),
  eficacia: z.string().optional()
});

type TratamentoFormData = z.infer<typeof tratamentoSchema>;

interface TratamentoFormProps {
  riscoId: string;
  tratamento?: any;
  onSuccess: () => void;
}

export function TratamentoForm({ riscoId, tratamento, onSuccess }: TratamentoFormProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<TratamentoFormData>({
    resolver: zodResolver(tratamentoSchema),
    defaultValues: {
      tipo_tratamento: tratamento?.tipo_tratamento || '',
      descricao: tratamento?.descricao || '',
      responsavel: tratamento?.responsavel || '',
      custo: tratamento?.custo?.toString() || '',
      prazo: tratamento?.prazo ? new Date(tratamento.prazo) : undefined,
      data_inicio: tratamento?.data_inicio ? new Date(tratamento.data_inicio) : undefined,
      status: tratamento?.status || 'pendente',
      eficacia: tratamento?.eficacia || ''
    }
  });

  const onSubmit = async (data: TratamentoFormData) => {
    if (!profile) return;

    setLoading(true);
    try {
      const submitData = {
        risco_id: riscoId,
        tipo_tratamento: data.tipo_tratamento,
        descricao: data.descricao,
        responsavel: data.responsavel || null,
        custo: data.custo ? parseFloat(data.custo) : null,
        prazo: data.prazo ? data.prazo.toISOString() : null,
        data_inicio: data.data_inicio ? data.data_inicio.toISOString() : null,
        status: data.status,
        eficacia: data.eficacia || null
      };

      if (tratamento) {
        const { error } = await supabase
          .from('riscos_tratamentos')
          .update(submitData)
          .eq('id', tratamento.id);

        if (error) throw error;
        toast.success('Tratamento atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('riscos_tratamentos')
          .insert(submitData);

        if (error) throw error;
        toast.success('Tratamento criado com sucesso!');
      }

      onSuccess();
    } catch (error: any) {
      toast.error('Erro ao salvar tratamento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tipo_tratamento">Tipo de Tratamento *</Label>
          <Select 
            value={form.watch('tipo_tratamento')} 
            onValueChange={(value) => form.setValue('tipo_tratamento', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mitigar">Mitigar</SelectItem>
              <SelectItem value="transferir">Transferir</SelectItem>
              <SelectItem value="aceitar">Aceitar</SelectItem>
              <SelectItem value="evitar">Evitar</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.tipo_tratamento && (
            <p className="text-sm text-destructive">{form.formState.errors.tipo_tratamento.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={form.watch('status')} 
            onValueChange={(value) => form.setValue('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em andamento">Em Andamento</SelectItem>
              <SelectItem value="concluído">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição do Tratamento *</Label>
        <Textarea
          {...form.register('descricao')}
          placeholder="Descreva detalhadamente o tratamento proposto..."
          rows={3}
        />
        {form.formState.errors.descricao && (
          <p className="text-sm text-destructive">{form.formState.errors.descricao.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="responsavel">Responsável</Label>
          <Input
            {...form.register('responsavel')}
            placeholder="Nome do responsável"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="custo">Custo Estimado (R$)</Label>
          <Input
            {...form.register('custo')}
            placeholder="0,00"
            type="number"
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data de Início</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !form.watch('data_inicio') && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.watch('data_inicio') ? format(form.watch('data_inicio')!, "PPP", { locale: ptBR }) : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={form.watch('data_inicio')}
                onSelect={(date) => form.setValue('data_inicio', date)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Prazo</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !form.watch('prazo') && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.watch('prazo') ? format(form.watch('prazo')!, "PPP", { locale: ptBR }) : "Selecionar prazo"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={form.watch('prazo')}
                onSelect={(date) => form.setValue('prazo', date)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="eficacia">Avaliação de Eficácia</Label>
        <Select 
          value={form.watch('eficacia') || ''} 
          onValueChange={(value) => form.setValue('eficacia', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Avaliar eficácia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="baixa">Baixa</SelectItem>
            <SelectItem value="média">Média</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="muito alta">Muito Alta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          * Campos obrigatórios
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : (tratamento ? 'Atualizar' : 'Criar')} Tratamento
          </Button>
        </div>
      </div>
    </form>
  );
}
