import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { UserSelect } from '@/components/riscos/UserSelect';
import { Server, Database, Cloud, Shield, Lock, Monitor, Globe, Key, HardDrive, Wifi, Eye, Box, Cpu, Settings, FileText, Folder, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Lista de ícones disponíveis
const availableIcons = [
  { value: 'server', label: 'Servidor', icon: Server },
  { value: 'database', label: 'Banco de Dados', icon: Database },
  { value: 'cloud', label: 'Nuvem', icon: Cloud },
  { value: 'shield', label: 'Segurança', icon: Shield },
  { value: 'lock', label: 'Cadeado', icon: Lock },
  { value: 'monitor', label: 'Monitor', icon: Monitor },
  { value: 'globe', label: 'Web', icon: Globe },
  { value: 'key', label: 'Chave', icon: Key },
  { value: 'harddrive', label: 'Armazenamento', icon: HardDrive },
  { value: 'wifi', label: 'Rede', icon: Wifi },
  { value: 'eye', label: 'Monitoramento', icon: Eye },
  { value: 'box', label: 'Container', icon: Box },
  { value: 'cpu', label: 'Processador', icon: Cpu },
  { value: 'settings', label: 'Configuração', icon: Settings },
  { value: 'filetext', label: 'Documento', icon: FileText },
  { value: 'folder', label: 'Diretório', icon: Folder },
  { value: 'barchart', label: 'Analytics', icon: BarChart3 },
];

const sistemaSchema = z.object({
  nome_sistema: z.string().min(1, 'Nome do sistema é obrigatório'),
  tipo_sistema: z.string().min(1, 'Tipo do sistema é obrigatório'),
  criticidade: z.string().min(1, 'Criticidade é obrigatória'),
  responsavel_sistema: z.string().optional(),
  url_sistema: z.string().url('URL inválida').optional().or(z.literal('')),
  categoria: z.string().optional(),
  observacoes: z.string().optional(),
  ativo: z.boolean().default(true),
  icone: z.string().default('server'),
});

type SistemaFormData = z.infer<typeof sistemaSchema>;

interface SistemaDialogProps {
  open: boolean;
  onClose: () => void;
  sistema?: any;
}

export default function SistemaDialog({ open, onClose, sistema }: SistemaDialogProps) {
  const { toast } = useToast();
  const { empresaId, loading: loadingEmpresa } = useEmpresaId();
  
  const form = useForm<SistemaFormData>({
    resolver: zodResolver(sistemaSchema),
    defaultValues: {
      nome_sistema: sistema?.nome_sistema || '',
      tipo_sistema: sistema?.tipo_sistema || 'aplicacao',
      criticidade: sistema?.criticidade || 'media',
      responsavel_sistema: sistema?.responsavel_sistema || '',
      url_sistema: sistema?.url_sistema || '',
      categoria: sistema?.categoria || '',
      observacoes: sistema?.observacoes || '',
      ativo: sistema?.ativo ?? true,
      icone: sistema?.icone || 'server',
    },
  });

  const selectedIcon = form.watch('icone');

  const onSubmit = async (data: SistemaFormData) => {
    try {
      if (!empresaId) {
        throw new Error('Empresa não encontrada');
      }

      const payload = {
        ...data,
        empresa_id: empresaId,
        responsavel_sistema: data.responsavel_sistema || null,
        url_sistema: data.url_sistema || null,
        categoria: data.categoria || null,
        observacoes: data.observacoes || null,
        icone: data.icone || 'server',
      };

      if (sistema?.id) {
        const { error } = await supabase
          .from('sistemas_privilegiados' as any)
          .update(payload)
          .eq('id', sistema.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Sistema atualizado com sucesso',
        });
      } else {
        const { error } = await supabase
          .from('sistemas_privilegiados' as any)
          .insert(payload);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Sistema criado com sucesso',
        });
      }

      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar sistema',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {sistema ? 'Editar Sistema' : 'Novo Sistema'}
          </DialogTitle>
          <DialogDescription>
            {sistema 
              ? 'Edite as informações do sistema'
              : 'Registre um novo sistema na organização'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Seletor de Ícone */}
            <FormField
              control={form.control}
              name="icone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ícone do Sistema</FormLabel>
                  <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                    {availableIcons.map((iconItem) => {
                      const IconComponent = iconItem.icon;
                      const isSelected = field.value === iconItem.value;
                      return (
                        <button
                          key={iconItem.value}
                          type="button"
                          onClick={() => field.onChange(iconItem.value)}
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-lg border-2 transition-all",
                            isSelected 
                              ? "border-primary bg-primary/10 text-primary" 
                              : "border-border hover:border-primary/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                          )}
                          title={iconItem.label}
                        >
                          <IconComponent className="h-5 w-5" />
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="nome_sistema"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Sistema *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Active Directory" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_sistema"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo do Sistema *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="aplicacao">Aplicação</SelectItem>
                        <SelectItem value="banco_dados">Banco de Dados</SelectItem>
                        <SelectItem value="sistema_operacional">Sistema Operacional</SelectItem>
                        <SelectItem value="rede">Rede/Infraestrutura</SelectItem>
                        <SelectItem value="nuvem">Nuvem</SelectItem>
                        <SelectItem value="erp">ERP</SelectItem>
                        <SelectItem value="crm">CRM</SelectItem>
                        <SelectItem value="bi">Business Intelligence</SelectItem>
                        <SelectItem value="seguranca">Segurança</SelectItem>
                        <SelectItem value="backup">Backup</SelectItem>
                        <SelectItem value="monitoramento">Monitoramento</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
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
                        <SelectItem value="critica">Crítica</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="baixa">Baixa</SelectItem>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="core_business">Core Business</SelectItem>
                        <SelectItem value="suporte">Suporte</SelectItem>
                        <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                        <SelectItem value="seguranca">Segurança</SelectItem>
                        <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                        <SelectItem value="financeiro">Financeiro</SelectItem>
                        <SelectItem value="rh">Recursos Humanos</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="responsavel_sistema"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável pelo Sistema</FormLabel>
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
                name="url_sistema"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do Sistema</FormLabel>
                    <FormControl>
                      <Input 
                        type="url" 
                        placeholder="https://sistema.exemplo.com" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações adicionais sobre o sistema..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Sistema Ativo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      O sistema está em uso e aceita novas contas privilegiadas
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {sistema ? 'Atualizar' : 'Criar'} Sistema
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
