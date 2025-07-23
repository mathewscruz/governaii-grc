import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link2, Shield, FileText, AlertTriangle, Database, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface IntegracaoData {
  contrato: {
    id: string;
    numero_contrato: string;
    nome: string;
    fornecedor_nome: string;
  };
  ativos: Array<{
    id: string;
    nome: string;
    tipo: string;
    status: string;
    criticidade: string;
  }>;
  riscos: Array<{
    id: string;
    nome: string;
    probabilidade_inicial: string;
    impacto_inicial: string;
    nivel_risco_inicial: string;
    status: string;
  }>;
  controles: Array<{
    id: string;
    nome: string;
    tipo: string;
    status: string;
    criticidade: string;
  }>;
  auditorias: Array<{
    id: string;
    nome: string;
    tipo: string;
    status: string;
  }>;
}

interface IntegracaoModulosProps {
  contratoId: string;
  trigger?: React.ReactNode;
}

export default function IntegracaoModulos({ contratoId, trigger }: IntegracaoModulosProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<IntegracaoData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && contratoId) {
      carregarIntegracoes();
    }
  }, [open, contratoId]);

  const carregarIntegracoes = async () => {
    setLoading(true);
    try {
      // Buscar dados do contrato
      const { data: contrato } = await supabase
        .from('contratos')
        .select(`
          id,
          numero_contrato,
          nome,
          fornecedores!inner(nome)
        `)
        .eq('id', contratoId)
        .single();

      if (!contrato) throw new Error('Contrato não encontrado');

      // Buscar ativos relacionados ao fornecedor
      const { data: ativos } = await supabase
        .from('ativos')
        .select('id, nome, tipo, status, criticidade')
        .ilike('fornecedor', `%${(contrato.fornecedores as any).nome}%`);

      // Buscar riscos que mencionam o fornecedor ou contrato
      const { data: riscos } = await supabase
        .from('riscos')
        .select('id, nome, probabilidade_inicial, impacto_inicial, nivel_risco_inicial, status')
        .or(`nome.ilike.%${(contrato.fornecedores as any).nome}%,descricao.ilike.%${contrato.numero_contrato}%`);

      // Buscar controles relacionados ao fornecedor
      const { data: controles } = await supabase
        .from('controles')
        .select('id, nome, tipo, status, criticidade')
        .or(`nome.ilike.%${(contrato.fornecedores as any).nome}%,descricao.ilike.%${contrato.numero_contrato}%`);

      // Buscar auditorias que mencionam o fornecedor
      const { data: auditorias } = await supabase
        .from('auditorias')
        .select('id, nome, tipo, status')
        .or(`nome.ilike.%${(contrato.fornecedores as any).nome}%,descricao.ilike.%${contrato.numero_contrato}%`);

      setDados({
        contrato: {
          id: contrato.id,
          numero_contrato: contrato.numero_contrato,
          nome: contrato.nome,
          fornecedor_nome: (contrato.fornecedores as any).nome
        },
        ativos: ativos || [],
        riscos: riscos || [],
        controles: controles || [],
        auditorias: auditorias || []
      });

    } catch (error) {
      console.error('Erro ao carregar integrações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de integração",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const criarVinculacao = async (tipo: 'ativo' | 'risco' | 'controle', itemId: string) => {
    try {
      // Implementar lógica de vinculação baseada no tipo
      switch (tipo) {
        case 'risco':
          // Criar vinculação indireta através de metadados ou tags
          await supabase
            .from('riscos')
            .update({
              causas: `Relacionado ao contrato ${dados?.contrato.numero_contrato}`,
            })
            .eq('id', itemId);
          break;
        
        case 'controle':
          // Atualizar descrição do controle para referenciar o contrato
          await supabase
            .from('controles')
            .update({
              descricao: `Controle relacionado ao contrato ${dados?.contrato.numero_contrato}`,
            })
            .eq('id', itemId);
          break;
      }

      toast({
        title: "Sucesso",
        description: `Vinculação criada com sucesso`,
      });

      carregarIntegracoes(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao criar vinculação:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar vinculação",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      ativo: "default",
      ativa: "default",
      identificado: "secondary",
      pendente: "outline",
      concluido: "default",
      encerrado: "secondary"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getCriticidadeBadge = (criticidade: string) => {
    const variants: Record<string, any> = {
      alta: "destructive",
      alto: "destructive",
      media: "outline",
      medio: "outline",
      baixa: "secondary",
      baixo: "secondary"
    };
    return <Badge variant={variants[criticidade] || "outline"}>{criticidade}</Badge>;
  };

  const getRiscoBadge = (nivel: string) => {
    const variants: Record<string, any> = {
      alto: "destructive",
      medio: "outline",
      baixo: "secondary"
    };
    return <Badge variant={variants[nivel] || "outline"}>{nivel}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Link2 className="h-4 w-4 mr-2" />
            Integrações
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Integrações com Outros Módulos</DialogTitle>
          <DialogDescription>
            Visualize e gerencie as relações do contrato com ativos, riscos, controles e auditorias
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Carregando integrações...</div>
        ) : dados ? (
          <div className="space-y-6">
            {/* Informações do Contrato */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {dados.contrato.numero_contrato} - {dados.contrato.nome}
                </CardTitle>
                <CardDescription>
                  Fornecedor: {dados.contrato.fornecedor_nome}
                </CardDescription>
              </CardHeader>
            </Card>

            <Tabs defaultValue="ativos" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="ativos" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Ativos ({dados.ativos.length})
                </TabsTrigger>
                <TabsTrigger value="riscos" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Riscos ({dados.riscos.length})
                </TabsTrigger>
                <TabsTrigger value="controles" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Controles ({dados.controles.length})
                </TabsTrigger>
                <TabsTrigger value="auditorias" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Auditorias ({dados.auditorias.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ativos" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Ativos Relacionados</CardTitle>
                    <CardDescription>
                      Ativos que referenciam o fornecedor deste contrato
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dados.ativos.length === 0 ? (
                      <p className="text-muted-foreground">Nenhum ativo encontrado</p>
                    ) : (
                      <div className="space-y-3">
                        {dados.ativos.map((ativo) => (
                          <div key={ativo.id} className="flex items-center justify-between p-3 border rounded">
                            <div className="space-y-1">
                              <div className="font-medium">{ativo.nome}</div>
                              <div className="text-sm text-muted-foreground">
                                Tipo: {ativo.tipo}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(ativo.status)}
                              {getCriticidadeBadge(ativo.criticidade)}
                              <Button size="sm" variant="outline" asChild>
                                <a href={`/ativos?search=${ativo.id}`} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="riscos" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Riscos Relacionados</CardTitle>
                    <CardDescription>
                      Riscos que mencionam este contrato ou fornecedor
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dados.riscos.length === 0 ? (
                      <p className="text-muted-foreground">Nenhum risco encontrado</p>
                    ) : (
                      <div className="space-y-3">
                        {dados.riscos.map((risco) => (
                          <div key={risco.id} className="flex items-center justify-between p-3 border rounded">
                            <div className="space-y-1">
                              <div className="font-medium">{risco.nome}</div>
                              <div className="text-sm text-muted-foreground">
                                Probabilidade: {risco.probabilidade_inicial} | Impacto: {risco.impacto_inicial}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(risco.status)}
                              {getRiscoBadge(risco.nivel_risco_inicial)}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => criarVinculacao('risco', risco.id)}
                              >
                                Vincular
                              </Button>
                              <Button size="sm" variant="outline" asChild>
                                <a href={`/riscos?search=${risco.id}`} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="controles" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Controles Relacionados</CardTitle>
                    <CardDescription>
                      Controles que podem estar relacionados a este contrato
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dados.controles.length === 0 ? (
                      <p className="text-muted-foreground">Nenhum controle encontrado</p>
                    ) : (
                      <div className="space-y-3">
                        {dados.controles.map((controle) => (
                          <div key={controle.id} className="flex items-center justify-between p-3 border rounded">
                            <div className="space-y-1">
                              <div className="font-medium">{controle.nome}</div>
                              <div className="text-sm text-muted-foreground">
                                Tipo: {controle.tipo}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(controle.status)}
                              {getCriticidadeBadge(controle.criticidade)}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => criarVinculacao('controle', controle.id)}
                              >
                                Vincular
                              </Button>
                              <Button size="sm" variant="outline" asChild>
                                <a href={`/controles?search=${controle.id}`} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="auditorias" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Auditorias Relacionadas</CardTitle>
                    <CardDescription>
                      Auditorias que podem incluir este contrato ou fornecedor
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dados.auditorias.length === 0 ? (
                      <p className="text-muted-foreground">Nenhuma auditoria encontrada</p>
                    ) : (
                      <div className="space-y-3">
                        {dados.auditorias.map((auditoria) => (
                          <div key={auditoria.id} className="flex items-center justify-between p-3 border rounded">
                            <div className="space-y-1">
                              <div className="font-medium">{auditoria.nome}</div>
                              <div className="text-sm text-muted-foreground">
                                Tipo: {auditoria.tipo}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(auditoria.status)}
                              <Button size="sm" variant="outline" asChild>
                                <a href={`/auditorias?search=${auditoria.id}`} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Erro ao carregar dados de integração
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}