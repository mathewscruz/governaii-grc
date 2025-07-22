import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

const riscoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  matriz_id: z.string().optional(),
  categoria_id: z.string().optional(),
  probabilidade_inicial: z.string().min(1, 'Probabilidade inicial é obrigatória'),
  impacto_inicial: z.string().min(1, 'Impacto inicial é obrigatório'),
  probabilidade_residual: z.string().optional(),
  impacto_residual: z.string().optional(),
  status: z.string().min(1, 'Status é obrigatório'),
  responsavel: z.string().optional(),
  controles_existentes: z.string().optional(),
  causas: z.string().optional(),
  consequencias: z.string().optional(),
  aceito: z.boolean().default(false),
  justificativa_aceite: z.string().optional(),
  ativos_vinculados: z.array(z.string()).default([])
});

type RiscoForm = z.infer<typeof riscoSchema>;

interface Matriz {
  id: string;
  nome: string;
  configuracao?: Array<{
    escala_probabilidade: any;
    escala_impacto: any;
    niveis_risco: any;
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

export function RiscoForm({ risco, onSuccess }: Props) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [matrizes, setMatrizes] = useState<Matriz[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [selectedMatriz, setSelectedMatriz] = useState<Matriz | null>(null);

  const form = useForm<RiscoForm>({
    resolver: zodResolver(riscoSchema),
    defaultValues: {
      nome: risco?.nome || '',
      descricao: risco?.descricao || '',
      matriz_id: risco?.matriz_id || '',
      categoria_id: risco?.categoria_id || '',
      probabilidade_inicial: risco?.probabilidade_inicial || '',
      impacto_inicial: risco?.impacto_inicial || '',
      probabilidade_residual: risco?.probabilidade_residual || '',
      impacto_residual: risco?.impacto_residual || '',
      status: risco?.status || 'identificado',
      responsavel: risco?.responsavel || '',
      controles_existentes: risco?.controles_existentes || '',
      causas: risco?.causas || '',
      consequencias: risco?.consequencias || '',
      aceito: risco?.aceito || false,
      justificativa_aceite: risco?.justificativa_aceite || '',
      ativos_vinculados: []
    }
  });

  const watchMatrizId = form.watch('matriz_id');
  const watchProbabilidade = form.watch('probabilidade_inicial');
  const watchImpacto = form.watch('impacto_inicial');
  const watchProbabilidadeResidual = form.watch('probabilidade_residual');
  const watchImpactoResidual = form.watch('impacto_residual');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (watchMatrizId) {
      const matriz = matrizes.find(m => m.id === watchMatrizId);
      if (matriz && matriz.configuracao && matriz.configuracao[0]) {
        setSelectedMatriz({
          ...matriz,
          configuracao: matriz.configuracao[0]
        } as any);
      } else {
        setSelectedMatriz(matriz || null);
      }
    }
  }, [watchMatrizId, matrizes]);

  const fetchData = async () => {
    try {
      // Buscar matrizes
      const { data: matrizesData } = await supabase
        .from('riscos_matrizes')
        .select(`
          id,
          nome,
          configuracao:riscos_matriz_configuracao(
            escala_probabilidade,
            escala_impacto,
            niveis_risco
          )
        `);

      setMatrizes(matrizesData || []);

      // Buscar categorias
      const { data: categoriasData } = await supabase
        .from('riscos_categorias')
        .select('id, nome, cor');

      setCategorias(categoriasData || []);

      // Buscar ativos
      const { data: ativosData } = await supabase
        .from('ativos')
        .select('id, nome, tipo');

      setAtivos(ativosData || []);

      // Se editando, buscar ativos vinculados
      if (risco?.id) {
        const { data: ativosVinculados } = await supabase
          .from('riscos_ativos')
          .select('ativo_id')
          .eq('risco_id', risco.id);

        if (ativosVinculados) {
          form.setValue('ativos_vinculados', ativosVinculados.map(av => av.ativo_id));
        }
      }
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    }
  };

  const calcularNivelRisco = (probabilidade: string, impacto: string): string => {
    if (!selectedMatriz?.configuracao || !probabilidade || !impacto) return '';

    const probValue = parseInt(probabilidade);
    const impactValue = parseInt(impacto);
    const produto = probValue * impactValue;

    const config = selectedMatriz.configuracao as any;
    const nivel = config.niveis_risco?.find((n: any) => 
      produto >= n.min && produto <= n.max
    );

    return nivel?.nivel || '';
  };

  const onSubmit = async (data: RiscoForm) => {
    if (!profile?.empresa_id) {
      toast.error('Erro: Empresa não identificada');
      return;
    }

    setLoading(true);

    try {
      const nivelInicial = calcularNivelRisco(data.probabilidade_inicial, data.impacto_inicial);
      const nivelResidual = data.probabilidade_residual && data.impacto_residual 
        ? calcularNivelRisco(data.probabilidade_residual, data.impacto_residual)
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
        justificativa_aceite: data.justificativa_aceite || null
      };

      let riscoId: string;

      if (risco?.id) {
        // Atualizando risco existente
        const { error } = await supabase
          .from('riscos')
          .update(riscoData)
          .eq('id', risco.id);

        if (error) throw error;
        riscoId = risco.id;
      } else {
        // Criando novo risco
        const { data: newRisco, error } = await supabase
          .from('riscos')
          .insert([riscoData])
          .select()
          .single();

        if (error) throw error;
        riscoId = newRisco.id;
      }

      // Atualizar vínculos com ativos
      if (data.ativos_vinculados.length > 0) {
        // Remover vínculos existentes
        await supabase
          .from('riscos_ativos')
          .delete()
          .eq('risco_id', riscoId);

        // Inserir novos vínculos
        const vinculos = data.ativos_vinculados.map(ativoId => ({
          risco_id: riscoId,
          ativo_id: ativoId
        }));

        const { error: vinculoError } = await supabase
          .from('riscos_ativos')
          .insert(vinculos);

        if (vinculoError) throw vinculoError;
      }

      toast.success(risco?.id ? 'Risco atualizado com sucesso!' : 'Risco cadastrado com sucesso!');
      onSuccess();
    } catch (error: any) {
      toast.error('Erro ao salvar risco: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const nivelInicialCalculado = calcularNivelRisco(watchProbabilidade, watchImpacto);
  const nivelResidualCalculado = calcularNivelRisco(watchProbabilidadeResidual || '', watchImpactoResidual || '');

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Risco</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>Matriz de Risco</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma matriz" />
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
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    <Input {...field} />
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
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          {/* Avaliação Inicial */}
          <Card>
            <CardHeader>
              <CardTitle>Avaliação Inicial do Risco</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="probabilidade_inicial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Probabilidade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(selectedMatriz?.configuracao as any)?.escala_probabilidade?.map((prob: any) => (
                            <SelectItem key={prob.valor} value={prob.valor}>
                              {prob.valor} - {prob.descricao}
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
                  name="impacto_inicial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Impacto</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(selectedMatriz?.configuracao as any)?.escala_impacto?.map((imp: any) => (
                            <SelectItem key={imp.valor} value={imp.valor}>
                              {imp.valor} - {imp.descricao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {nivelInicialCalculado && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Nível de Risco Calculado:</span>
                  <Badge>{nivelInicialCalculado}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Avaliação Residual */}
          <Card>
            <CardHeader>
              <CardTitle>Avaliação Residual (Após Tratamento)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="probabilidade_residual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Probabilidade Residual</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(selectedMatriz?.configuracao as any)?.escala_probabilidade?.map((prob: any) => (
                            <SelectItem key={prob.valor} value={prob.valor}>
                              {prob.valor} - {prob.descricao}
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
                  name="impacto_residual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Impacto Residual</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(selectedMatriz?.configuracao as any)?.escala_impacto?.map((imp: any) => (
                            <SelectItem key={imp.valor} value={imp.valor}>
                              {imp.valor} - {imp.descricao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {nivelResidualCalculado && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Nível de Risco Residual:</span>
                  <Badge>{nivelResidualCalculado}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              name="ativos_vinculados"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ativos Vinculados</FormLabel>
                  <div className="space-y-2">
                    {ativos.map((ativo) => (
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
                        <label htmlFor={ativo.id} className="text-sm">
                          {ativo.nome} ({ativo.tipo})
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="causas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Causas</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
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
                    <Textarea {...field} />
                  </FormControl>
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
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Aceite do Risco */}
          <Card>
            <CardHeader>
              <CardTitle>Aceite do Risco</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                      <FormLabel>
                        Risco aceito formalmente
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch('aceito') && (
                <FormField
                  control={form.control}
                  name="justificativa_aceite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Justificativa do Aceite</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>
        </form>
      </Form>
      
      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={() => onSuccess()} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} onClick={form.handleSubmit(onSubmit)}>
          {loading ? 'Salvando...' : (risco?.id ? 'Atualizar' : 'Cadastrar')}
        </Button>
      </DialogFooter>
    </div>
  );
}
