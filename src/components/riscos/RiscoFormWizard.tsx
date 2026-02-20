import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Save, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { UserSelect } from './UserSelect';
import { RiscoAnexosUpload } from './RiscoAnexosUpload';
import { cn } from '@/lib/utils';
import { useIntegrationNotify } from '@/hooks/useIntegrationNotify';

const riscoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  categoria_id: z.string().optional(),
  descricao: z.string().optional(),
  matriz_id: z.string().min(1, 'Matriz de risco é obrigatória'),
  responsavel: z.string().optional(),
  probabilidade_inicial: z.string().min(1, 'Probabilidade inicial é obrigatória'),
  impacto_inicial: z.string().min(1, 'Impacto inicial é obrigatório'),
  causas: z.string().optional(),
  consequencias: z.string().optional(),
  status: z.string().min(1, 'Status é obrigatório'),
  controles_existentes: z.string().optional(),
  probabilidade_residual: z.string().optional(),
  impacto_residual: z.string().optional(),
  aceito: z.boolean().default(false),
  justificativa_aceite: z.string().optional(),
  ativos_vinculados: z.array(z.string()).default([]),
  data_proxima_revisao: z.string().optional()
});

type RiscoForm = z.infer<typeof riscoSchema>;

interface Matriz {
  id: string;
  nome: string;
  configuracao?: Array<{
    escala_probabilidade: any;
    escala_impacto: any;
    niveis_risco: any;
    metodo_calculo?: string;
  }>;
}

interface Categoria {
  id: string;
  nome: string;
  cor?: string;
}

interface Ativo {
  id: string;
  nome: string;
  tipo: string;
}

interface Props {
  risco?: any;
  onSuccess: () => void;
}

export function RiscoFormWizard({ risco, onSuccess }: Props) {
  const { profile } = useAuth();
  const { notify } = useIntegrationNotify();
  const [loading, setLoading] = useState(false);
  const [matrizes, setMatrizes] = useState<Matriz[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [selectedMatriz, setSelectedMatriz] = useState<Matriz | null>(null);
  const [anexosAceite, setAnexosAceite] = useState<any[]>([]);
  
  const [openSections, setOpenSections] = useState({
    basico: true,
    avaliacao: true,
    detalhes: true,
    residual: false,
    aceite: false
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const form = useForm<RiscoForm>({
    resolver: zodResolver(riscoSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      matriz_id: '',
      categoria_id: '',
      responsavel: '',
      probabilidade_inicial: '',
      impacto_inicial: '',
      probabilidade_residual: '',
      impacto_residual: '',
      status: 'identificado',
      controles_existentes: '',
      causas: '',
      consequencias: '',
      aceito: false,
      justificativa_aceite: '',
      ativos_vinculados: [],
      data_proxima_revisao: ''
    }
  });

  const watchMatrizId = form.watch('matriz_id');
  const watchProbabilidade = form.watch('probabilidade_inicial');
  const watchImpacto = form.watch('impacto_inicial');
  const watchProbabilidadeResidual = form.watch('probabilidade_residual');
  const watchImpactoResidual = form.watch('impacto_residual');
  const watchAceito = form.watch('aceito');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (risco && matrizes.length > 0) {
      console.log('📝 Carregando dados do risco para edição:', risco);
      
      form.reset({
        nome: risco.nome || '',
        descricao: risco.descricao || '',
        matriz_id: risco.matriz_id || '',
        categoria_id: risco.categoria_id || '',
        responsavel: risco.responsavel || '',
        probabilidade_inicial: risco.probabilidade_inicial?.toString() || '',
        impacto_inicial: risco.impacto_inicial?.toString() || '',
        probabilidade_residual: risco.probabilidade_residual?.toString() || '',
        impacto_residual: risco.impacto_residual?.toString() || '',
        status: risco.status || 'identificado',
        controles_existentes: risco.controles_existentes || '',
        causas: risco.causas || '',
        consequencias: risco.consequencias || '',
        aceito: risco.aceito || false,
        justificativa_aceite: risco.justificativa_aceite || '',
        ativos_vinculados: [],
        data_proxima_revisao: risco.data_proxima_revisao || ''
      });

      // Forçar seleção da matriz após reset do form
      if (risco.matriz_id) {
        const matriz = matrizes.find(m => m.id === risco.matriz_id);
        if (matriz && matriz.configuracao && matriz.configuracao[0]) {
          console.log('✅ Matriz carregada automaticamente:', matriz.nome);
          setSelectedMatriz({
            ...matriz,
            configuracao: {
              ...matriz.configuracao[0],
              metodo_calculo: matriz.configuracao[0].metodo_calculo || 'multiplicacao'
            }
          } as any);
        }
      }

      if (risco.id) {
        fetchAnexosAceite(risco.id);
        fetchAtivosVinculados(risco.id);
      }
    }
  }, [risco, matrizes]);

  useEffect(() => {
    if (watchMatrizId) {
      const matriz = matrizes.find(m => m.id === watchMatrizId);
      if (matriz && matriz.configuracao && matriz.configuracao[0]) {
        setSelectedMatriz({
          ...matriz,
          configuracao: {
            ...matriz.configuracao[0],
            metodo_calculo: matriz.configuracao[0].metodo_calculo || 'multiplicacao'
          }
        } as any);
      } else {
        setSelectedMatriz(matriz || null);
      }
    }
  }, [watchMatrizId, matrizes]);

  const fetchData = async () => {
    try {
      const [matrizesRes, categoriasRes, ativosRes] = await Promise.all([
        supabase.from('riscos_matrizes').select(`
          id,
          nome,
          configuracao:riscos_matriz_configuracao(
            escala_probabilidade,
            escala_impacto,
            niveis_risco,
            metodo_calculo
          )
        `),
        supabase.from('riscos_categorias').select('id, nome, cor'),
        supabase.from('ativos').select('id, nome, tipo')
      ]);

      if (matrizesRes.data) setMatrizes(matrizesRes.data);
      if (categoriasRes.data) setCategorias(categoriasRes.data);
      if (ativosRes.data) setAtivos(ativosRes.data);
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    }
  };

  const fetchAnexosAceite = async (riscoId: string) => {
    try {
      const { data, error } = await supabase
        .from('riscos_anexos')
        .select('*')
        .eq('risco_id', riscoId)
        .eq('tipo_anexo', 'aceite')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const anexosFormatados = (data || []).map(anexo => ({
        id: anexo.id,
        nome_arquivo: anexo.nome_arquivo,
        url_arquivo: anexo.url_arquivo,
        tipo_arquivo: anexo.tipo_arquivo,
        tamanho_arquivo: anexo.tamanho_arquivo,
        created_at: anexo.created_at
      }));
      
      setAnexosAceite(anexosFormatados);
    } catch (error: any) {
      console.error('Erro ao buscar anexos:', error);
    }
  };

  const fetchAtivosVinculados = async (riscoId: string) => {
    try {
      const { data } = await supabase
        .from('riscos_ativos')
        .select('ativo_id')
        .eq('risco_id', riscoId);

      if (data) {
        form.setValue('ativos_vinculados', data.map(av => av.ativo_id));
      }
    } catch (error) {
      console.error('Erro ao buscar ativos vinculados:', error);
    }
  };

  const calcularNivelRisco = (probabilidade: string, impacto: string, metodoCalculo: string = 'multiplicacao'): string => {
    if (!selectedMatriz?.configuracao || !probabilidade || !impacto) return '';

    const probValue = parseInt(probabilidade);
    const impactValue = parseInt(impacto);
    
    if (isNaN(probValue) || isNaN(impactValue)) return '';
    
    const resultado = metodoCalculo === 'multiplicacao' 
      ? probValue * impactValue
      : probValue + impactValue;

    const config = selectedMatriz.configuracao as any;
    const nivel = config.niveis_risco?.find((n: any) => 
      resultado >= n.min && resultado <= n.max
    );

    return nivel?.nivel || '';
  };

  const nivelInicialCalculado = calcularNivelRisco(
    watchProbabilidade, 
    watchImpacto,
    (selectedMatriz?.configuracao as any)?.metodo_calculo || 'multiplicacao'
  );

  const nivelResidualCalculado = calcularNivelRisco(
    watchProbabilidadeResidual || '', 
    watchImpactoResidual || '',
    (selectedMatriz?.configuracao as any)?.metodo_calculo || 'multiplicacao'
  );

  const onSubmit = async (data: RiscoForm) => {
    console.log('🚀 onSubmit chamado com dados:', data);
    
    if (!profile?.empresa_id) {
      toast.error('Erro: Empresa não identificada');
      return;
    }
    
    // Validar campos obrigatórios
    if (!data.matriz_id) {
      toast.error('Erro: Matriz de risco é obrigatória');
      return;
    }
    
    if (!selectedMatriz) {
      toast.error('Erro: Configuração da matriz não carregada');
      return;
    }

    setLoading(true);

    try {
      const nivelInicial = calcularNivelRisco(
        data.probabilidade_inicial, 
        data.impacto_inicial,
        (selectedMatriz?.configuracao as any)?.metodo_calculo || 'multiplicacao'
      );
      const nivelResidual = data.probabilidade_residual && data.impacto_residual 
        ? calcularNivelRisco(
            data.probabilidade_residual, 
            data.impacto_residual,
            (selectedMatriz?.configuracao as any)?.metodo_calculo || 'multiplicacao'
          )
        : null;

      const riscoData = {
        nome: data.nome,
        descricao: data.descricao,
        empresa_id: profile.empresa_id,
        matriz_id: data.matriz_id || null,
        categoria_id: data.categoria_id || null,
        probabilidade_inicial: data.probabilidade_inicial,
        impacto_inicial: data.impacto_inicial,
        nivel_risco_inicial: nivelInicial,
        probabilidade_residual: data.probabilidade_residual || null,
        impacto_residual: data.impacto_residual || null,
        nivel_risco_residual: nivelResidual,
        status: data.status,
        responsavel: data.responsavel || null,
        controles_existentes: data.controles_existentes || null,
        causas: data.causas || null,
        consequencias: data.consequencias || null,
        aceito: data.aceito,
        justificativa_aceite: data.justificativa_aceite || null,
        data_proxima_revisao: data.data_proxima_revisao || null
      };

      let riscoId: string;

      if (risco?.id) {
        const { error } = await supabase
          .from('riscos')
          .update(riscoData)
          .eq('id', risco.id);

        if (error) throw error;
        riscoId = risco.id;
      } else {
        const { data: newRisco, error } = await supabase
          .from('riscos')
          .insert([riscoData])
          .select()
          .single();

        if (error) throw error;
        riscoId = newRisco.id;
        
        // Notificar integrações sobre novo risco
        const nivelGravidadeMap: Record<string, 'baixa' | 'media' | 'alta' | 'critica'> = {
          'baixo': 'baixa',
          'medio': 'media',
          'alto': 'alta',
          'critico': 'critica'
        };
        
        await notify('risco_identificado', {
          titulo: `Novo Risco: ${data.nome}`,
          descricao: data.descricao || `Risco identificado com nível ${nivelInicial}`,
          link: `${window.location.origin}/riscos`,
          gravidade: nivelGravidadeMap[nivelInicial?.toLowerCase()] || 'media',
          dados: { nivel: nivelInicial, status: data.status }
        });
        
        for (const anexo of anexosAceite) {
          if (!anexo.id && riscoId) {
            try {
              await supabase.from('riscos_anexos').insert({
                risco_id: riscoId,
                nome_arquivo: anexo.nome_arquivo,
                url_arquivo: anexo.url_arquivo,
                tipo_arquivo: anexo.tipo_arquivo,
                tamanho_arquivo: anexo.tamanho_arquivo,
                tipo_anexo: 'aceite',
                empresa_id: profile.empresa_id,
                created_by: profile.user_id
              });
            } catch (anexoError) {
              console.error('Erro ao salvar anexo:', anexoError);
            }
          }
        }
      }

      // Atualizar vínculos com ativos
      await supabase.from('riscos_ativos').delete().eq('risco_id', riscoId);
      
      if (data.ativos_vinculados.length > 0) {
        const vinculos = data.ativos_vinculados.map(ativoId => ({
          risco_id: riscoId,
          ativo_id: ativoId
        }));

        await supabase.from('riscos_ativos').insert(vinculos);
      }

      toast.success(risco?.id ? 'Risco atualizado com sucesso!' : 'Risco cadastrado com sucesso!');
      onSuccess();
    } catch (error: any) {
      console.error('❌ Erro ao salvar risco:', error);
      toast.error('Erro ao salvar risco: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Informações Básicas */}
        <Collapsible open={openSections.basico} onOpenChange={() => toggleSection('basico')}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Informações Básicas *
                    </CardTitle>
                    <CardDescription>
                      Identificação e categoria do risco
                    </CardDescription>
                  </div>
                  <ChevronDown className={cn(
                    "h-5 w-5 transition-transform",
                    openSections.basico && "rotate-180"
                  )} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Risco *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Falha de backup de dados" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoria_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categorias.map((categoria) => (
                              <SelectItem key={categoria.id} value={categoria.id}>
                                <div className="flex items-center gap-2">
                                  {categoria.cor && (
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: categoria.cor }}
                                    />
                                  )}
                                  {categoria.nome}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="responsavel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsável</FormLabel>
                        <FormControl>
                          <UserSelect
                            value={field.value || ''}
                            onValueChange={field.onChange}
                            placeholder="Selecione um responsável"
                          />
                        </FormControl>
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
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva o risco detalhadamente..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="matriz_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matriz de Risco *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a matriz" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {matrizes.map((matriz) => (
                            <SelectItem key={matriz.id} value={matriz.id}>
                              {matriz.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        A matriz define como o risco será avaliado
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Avaliação Inicial do Risco */}
        <Collapsible open={openSections.avaliacao} onOpenChange={() => toggleSection('avaliacao')}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <CardTitle>Avaliação Inicial do Risco *</CardTitle>
                    <CardDescription>
                      Probabilidade e impacto sem controles
                    </CardDescription>
                  </div>
                  <ChevronDown className={cn(
                    "h-5 w-5 transition-transform",
                    openSections.avaliacao && "rotate-180"
                  )} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="probabilidade_inicial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Probabilidade *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(selectedMatriz?.configuracao as any)?.escala_probabilidade?.length > 0 
                              ? ((selectedMatriz?.configuracao as any)?.escala_probabilidade || []).map((item: any) => (
                                  <SelectItem key={item.valor} value={item.valor.toString()}>
                                    {item.valor} - {item.descricao}
                                  </SelectItem>
                                ))
                              : [1, 2, 3, 4, 5].map((value) => (
                                  <SelectItem key={value} value={value.toString()}>
                                    {value}
                                  </SelectItem>
                                ))
                            }
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="impacto_inicial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Impacto *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(selectedMatriz?.configuracao as any)?.escala_impacto?.length > 0 
                              ? ((selectedMatriz?.configuracao as any)?.escala_impacto || []).map((item: any) => (
                                  <SelectItem key={item.valor} value={item.valor.toString()}>
                                    {item.valor} - {item.descricao}
                                  </SelectItem>
                                ))
                              : [1, 2, 3, 4, 5].map((value) => (
                                  <SelectItem key={value} value={value.toString()}>
                                    {value}
                                  </SelectItem>
                                ))
                            }
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {nivelInicialCalculado && (
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Nível de Risco Calculado:</span>
                    <Badge variant="outline" className="text-base">
                      {nivelInicialCalculado}
                    </Badge>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="causas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Causas</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="O que pode causar este risco?" 
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="consequencias"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consequências</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Quais os impactos se ocorrer?" 
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Detalhes Adicionais */}
        <Collapsible open={openSections.detalhes} onOpenChange={() => toggleSection('detalhes')}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <CardTitle>Detalhes Adicionais</CardTitle>
                    <CardDescription>
                      Status, controles e ativos vinculados
                    </CardDescription>
                  </div>
                  <ChevronDown className={cn(
                    "h-5 w-5 transition-transform",
                    openSections.detalhes && "rotate-180"
                  )} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="identificado">Identificado</SelectItem>
                          <SelectItem value="analisado">Analisado</SelectItem>
                          <SelectItem value="tratado">Tratado</SelectItem>
                          <SelectItem value="monitorado">Monitorado</SelectItem>
                          <SelectItem value="aceito">Aceito</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_proxima_revisao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Próxima Revisão</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        Agende quando este risco deve ser reavaliado
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="controles_existentes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Controles Existentes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva os controles já implementados..." 
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Ativos Vinculados</FormLabel>
                  <FormField
                    control={form.control}
                    name="ativos_vinculados"
                    render={({ field }) => (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-4">
                        {ativos.length === 0 ? (
                          <p className="text-sm text-muted-foreground col-span-2">Nenhum ativo cadastrado</p>
                        ) : (
                          ativos.map((ativo) => (
                            <div key={ativo.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={ativo.id}
                                checked={field.value.includes(ativo.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, ativo.id]);
                                  } else {
                                    field.onChange(field.value.filter(id => id !== ativo.id));
                                  }
                                }}
                              />
                              <label
                                htmlFor={ativo.id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {ativo.nome}
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Avaliação Residual */}
        <Collapsible open={openSections.residual} onOpenChange={() => toggleSection('residual')}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <CardTitle>Avaliação Residual (Opcional)</CardTitle>
                    <CardDescription>
                      Risco após implementação de controles
                    </CardDescription>
                  </div>
                  <ChevronDown className={cn(
                    "h-5 w-5 transition-transform",
                    openSections.residual && "rotate-180"
                  )} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="probabilidade_residual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Probabilidade Residual</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(selectedMatriz?.configuracao as any)?.escala_probabilidade?.length > 0 
                              ? ((selectedMatriz?.configuracao as any)?.escala_probabilidade || []).map((item: any) => (
                                  <SelectItem key={item.valor} value={item.valor.toString()}>
                                    {item.valor} - {item.descricao}
                                  </SelectItem>
                                ))
                              : [1, 2, 3, 4, 5].map((value) => (
                                  <SelectItem key={value} value={value.toString()}>
                                    {value}
                                  </SelectItem>
                                ))
                            }
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="impacto_residual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Impacto Residual</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(selectedMatriz?.configuracao as any)?.escala_impacto?.length > 0 
                              ? ((selectedMatriz?.configuracao as any)?.escala_impacto || []).map((item: any) => (
                                  <SelectItem key={item.valor} value={item.valor.toString()}>
                                    {item.valor} - {item.descricao}
                                  </SelectItem>
                                ))
                              : [1, 2, 3, 4, 5].map((value) => (
                                  <SelectItem key={value} value={value.toString()}>
                                    {value}
                                  </SelectItem>
                                ))
                            }
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {nivelResidualCalculado && (
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Nível Residual Calculado:</span>
                    <Badge variant="outline" className="text-base">
                      {nivelResidualCalculado}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Aceite do Risco */}
        <Collapsible open={openSections.aceite} onOpenChange={() => toggleSection('aceite')}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <CardTitle>Aceite do Risco (Opcional)</CardTitle>
                    <CardDescription>
                      Formalização da decisão de aceitar o risco
                    </CardDescription>
                  </div>
                  <ChevronDown className={cn(
                    "h-5 w-5 transition-transform",
                    openSections.aceite && "rotate-180"
                  )} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="aceito"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Aceitar este risco formalmente</FormLabel>
                        <FormDescription>
                          Marque se a organização decidiu aceitar o risco
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {watchAceito && (
                  <>
                    <FormField
                      control={form.control}
                      name="justificativa_aceite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Justificativa do Aceite</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Justifique a decisão de aceitar o risco..." 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {risco?.id && (
                      <div className="space-y-2">
                        <FormLabel>Anexos de Aceite</FormLabel>
                        <RiscoAnexosUpload
                          riscoId={risco.id}
                          anexos={anexosAceite}
                          onAnexosChange={setAnexosAceite}
                          tipoAnexo="aceite"
                        />
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Botão Salvar */}
        <div className="flex justify-end pt-6 mt-2 border-t">
          <Button type="submit" disabled={loading} size="lg">
            {loading ? 'Salvando...' : risco ? 'Atualizar Risco' : 'Salvar Risco'}
            <Save className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
