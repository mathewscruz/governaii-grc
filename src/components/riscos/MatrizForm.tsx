import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { DialogFooter } from '@/components/ui/dialog';

const matrizSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
});

const categoriaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  cor: z.string().optional(),
});

type MatrizForm = z.infer<typeof matrizSchema>;
type CategoriaForm = z.infer<typeof categoriaSchema>;

interface EscalaItem {
  valor: string;
  descricao: string;
}

interface NivelRisco {
  min: number;
  max: number;
  nivel: string;
  cor: string;
}

interface Matriz {
  id: string;
  nome: string;
  descricao?: string;
}

interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  cor?: string;
}

interface Props {
  onSuccess: () => void;
}

export function MatrizForm({ onSuccess }: Props) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [matrizes, setMatrizes] = useState<Matriz[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedMatriz, setSelectedMatriz] = useState<string>('');
  
  // Escalas para configuração da matriz
  const [escalaProbabilidade, setEscalaProbabilidade] = useState<EscalaItem[]>([
    { valor: '1', descricao: 'Muito Raro' },
    { valor: '2', descricao: 'Raro' },
    { valor: '3', descricao: 'Ocasional' },
    { valor: '4', descricao: 'Provável' },
    { valor: '5', descricao: 'Muito Provável' }
  ]);
  
  const [escalaImpacto, setEscalaImpacto] = useState<EscalaItem[]>([
    { valor: '1', descricao: 'Insignificante' },
    { valor: '2', descricao: 'Menor' },
    { valor: '3', descricao: 'Moderado' },
    { valor: '4', descricao: 'Maior' },
    { valor: '5', descricao: 'Catastrófico' }
  ]);

  const [niveisRisco, setNiveisRisco] = useState<NivelRisco[]>([
    { min: 1, max: 4, nivel: 'Baixo', cor: '#22c55e' },
    { min: 5, max: 9, nivel: 'Médio', cor: '#eab308' },
    { min: 10, max: 16, nivel: 'Alto', cor: '#f97316' },
    { min: 17, max: 25, nivel: 'Crítico', cor: '#dc2626' }
  ]);

  const matrizForm = useForm<MatrizForm>({
    resolver: zodResolver(matrizSchema),
    defaultValues: {
      nome: '',
      descricao: ''
    }
  });

  const categoriaForm = useForm<CategoriaForm>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      cor: '#3b82f6'
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Buscar matrizes existentes
      const { data: matrizesData } = await supabase
        .from('riscos_matrizes')
        .select('id, nome, descricao')
        .order('created_at', { ascending: false });

      setMatrizes(matrizesData || []);

      // Buscar categorias existentes
      const { data: categoriasData } = await supabase
        .from('riscos_categorias')
        .select('id, nome, descricao, cor')
        .order('created_at', { ascending: false });

      setCategorias(categoriasData || []);
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    }
  };

  const onSubmitMatriz = async (data: MatrizForm) => {
    if (!profile?.empresa_id) {
      toast.error('Erro: Empresa não identificada');
      return;
    }

    setLoading(true);

    try {
      // Criar matriz
      const { data: novaMatriz, error: matrizError } = await supabase
        .from('riscos_matrizes')
        .insert([{
          nome: data.nome,
          descricao: data.descricao,
          empresa_id: profile.empresa_id
        }])
        .select()
        .single();

      if (matrizError) throw matrizError;

      // Criar configuração da matriz
      const { error: configError } = await supabase
        .from('riscos_matriz_configuracao')
        .insert({
          matriz_id: novaMatriz.id,
          escala_probabilidade: escalaProbabilidade as any,
          escala_impacto: escalaImpacto as any,
          niveis_risco: niveisRisco as any
        });

      if (configError) throw configError;

      toast.success('Matriz de risco criada com sucesso!');
      matrizForm.reset();
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao criar matriz: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitCategoria = async (data: CategoriaForm) => {
    if (!profile?.empresa_id) {
      toast.error('Erro: Empresa não identificada');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('riscos_categorias')
        .insert([{
          nome: data.nome,
          descricao: data.descricao,
          cor: data.cor,
          empresa_id: profile.empresa_id
        }]);

      if (error) throw error;

      toast.success('Categoria criada com sucesso!');
      categoriaForm.reset();
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao criar categoria: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const adicionarEscalaProbabilidade = () => {
    const proximoValor = (escalaProbabilidade.length + 1).toString();
    setEscalaProbabilidade([...escalaProbabilidade, { valor: proximoValor, descricao: '' }]);
  };

  const removerEscalaProbabilidade = (index: number) => {
    setEscalaProbabilidade(escalaProbabilidade.filter((_, i) => i !== index));
  };

  const adicionarEscalaImpacto = () => {
    const proximoValor = (escalaImpacto.length + 1).toString();
    setEscalaImpacto([...escalaImpacto, { valor: proximoValor, descricao: '' }]);
  };

  const removerEscalaImpacto = (index: number) => {
    setEscalaImpacto(escalaImpacto.filter((_, i) => i !== index));
  };

  const adicionarNivelRisco = () => {
    const ultimoMax = niveisRisco[niveisRisco.length - 1]?.max || 0;
    setNiveisRisco([...niveisRisco, { 
      min: ultimoMax + 1, 
      max: ultimoMax + 5, 
      nivel: '', 
      cor: '#6b7280' 
    }]);
  };

  const removerNivelRisco = (index: number) => {
    setNiveisRisco(niveisRisco.filter((_, i) => i !== index));
  };

  const atualizarEscalaProbabilidade = (index: number, field: keyof EscalaItem, value: string) => {
    const novaEscala = [...escalaProbabilidade];
    novaEscala[index] = { ...novaEscala[index], [field]: value };
    setEscalaProbabilidade(novaEscala);
  };

  const atualizarEscalaImpacto = (index: number, field: keyof EscalaItem, value: string) => {
    const novaEscala = [...escalaImpacto];
    novaEscala[index] = { ...novaEscala[index], [field]: value };
    setEscalaImpacto(novaEscala);
  };

  const atualizarNivelRisco = (index: number, field: keyof NivelRisco, value: string | number) => {
    const novosNiveis = [...niveisRisco];
    novosNiveis[index] = { ...novosNiveis[index], [field]: value };
    setNiveisRisco(novosNiveis);
  };

  const excluirMatriz = async (id: string) => {
    try {
      const { error } = await supabase
        .from('riscos_matrizes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Matriz excluída com sucesso!');
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao excluir matriz: ' + error.message);
    }
  };

  const excluirCategoria = async (id: string) => {
    try {
      const { error } = await supabase
        .from('riscos_categorias')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Categoria excluída com sucesso!');
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao excluir categoria: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="matrizes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="matrizes">Matrizes de Risco</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="matrizes" className="space-y-6">
          {/* Formulário para nova matriz */}
          <Card>
            <CardHeader>
              <CardTitle>Nova Matriz de Risco</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...matrizForm}>
                <form onSubmit={matrizForm.handleSubmit(onSubmitMatriz)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={matrizForm.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Matriz</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={matrizForm.control}
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

                  {/* Configuração de Escalas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Escala de Probabilidade */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Escala de Probabilidade</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={adicionarEscalaProbabilidade}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {escalaProbabilidade.map((item, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={item.valor}
                            onChange={(e) => atualizarEscalaProbabilidade(index, 'valor', e.target.value)}
                            placeholder="Valor"
                            className="w-20"
                          />
                          <Input
                            value={item.descricao}
                            onChange={(e) => atualizarEscalaProbabilidade(index, 'descricao', e.target.value)}
                            placeholder="Descrição"
                            className="flex-1"
                          />
                          {escalaProbabilidade.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removerEscalaProbabilidade(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Escala de Impacto */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Escala de Impacto</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={adicionarEscalaImpacto}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {escalaImpacto.map((item, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={item.valor}
                            onChange={(e) => atualizarEscalaImpacto(index, 'valor', e.target.value)}
                            placeholder="Valor"
                            className="w-20"
                          />
                          <Input
                            value={item.descricao}
                            onChange={(e) => atualizarEscalaImpacto(index, 'descricao', e.target.value)}
                            placeholder="Descrição"
                            className="flex-1"
                          />
                          {escalaImpacto.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removerEscalaImpacto(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Níveis de Risco */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Níveis de Risco</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={adicionarNivelRisco}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {niveisRisco.map((nivel, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          type="number"
                          value={nivel.min}
                          onChange={(e) => atualizarNivelRisco(index, 'min', parseInt(e.target.value))}
                          placeholder="Min"
                          className="w-20"
                        />
                        <span>-</span>
                        <Input
                          type="number"
                          value={nivel.max}
                          onChange={(e) => atualizarNivelRisco(index, 'max', parseInt(e.target.value))}
                          placeholder="Max"
                          className="w-20"
                        />
                        <Input
                          value={nivel.nivel}
                          onChange={(e) => atualizarNivelRisco(index, 'nivel', e.target.value)}
                          placeholder="Nome do nível"
                          className="flex-1"
                        />
                        <Input
                          type="color"
                          value={nivel.cor}
                          onChange={(e) => atualizarNivelRisco(index, 'cor', e.target.value)}
                          className="w-16"
                        />
                        {niveisRisco.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removerNivelRisco(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Criando...' : 'Criar Matriz'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Lista de matrizes existentes */}
          {matrizes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Matrizes Existentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {matrizes.map((matriz) => (
                    <div key={matriz.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{matriz.nome}</h4>
                        {matriz.descricao && (
                          <p className="text-sm text-muted-foreground">{matriz.descricao}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => excluirMatriz(matriz.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categorias" className="space-y-6">
          {/* Formulário para nova categoria */}
          <Card>
            <CardHeader>
              <CardTitle>Nova Categoria de Risco</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...categoriaForm}>
                <form onSubmit={categoriaForm.handleSubmit(onSubmitCategoria)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={categoriaForm.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Categoria</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={categoriaForm.control}
                      name="cor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cor</FormLabel>
                          <FormControl>
                            <Input type="color" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={categoriaForm.control}
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

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Criando...' : 'Criar Categoria'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Lista de categorias existentes */}
          {categorias.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Categorias Existentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categorias.map((categoria) => (
                    <div key={categoria.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {categoria.cor && (
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: categoria.cor }}
                          />
                        )}
                        <div>
                          <h4 className="font-medium">{categoria.nome}</h4>
                          {categoria.descricao && (
                            <p className="text-sm text-muted-foreground">{categoria.descricao}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => excluirCategoria(categoria.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button onClick={onSuccess}>
          Concluir
        </Button>
      </DialogFooter>
    </div>
  );
}
