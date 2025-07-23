import React, { useState, useEffect } from 'react';
import { Bell, Calendar, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificacaoContrato {
  id: string;
  tipo: 'vencimento' | 'marco' | 'renovacao' | 'documento';
  prioridade: 'alta' | 'media' | 'baixa';
  titulo: string;
  descricao: string;
  data_alerta: string;
  contrato_id: string;
  lida: boolean;
  contrato?: {
    numero_contrato: string;
    nome: string;
  };
}

export default function NotificacoesContratos() {
  const [notificacoes, setNotificacoes] = useState<NotificacaoContrato[]>([]);
  const [loading, setLoading] = useState(false);
  const [contadorNaoLidas, setContadorNaoLidas] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    verificarNotificacoes();
    const interval = setInterval(verificarNotificacoes, 300000); // Verifica a cada 5 minutos
    return () => clearInterval(interval);
  }, []);

  const verificarNotificacoes = async () => {
    setLoading(true);
    try {
      const notificacoesGeradas = await gerarNotificacoesAutomaticas();
      setNotificacoes(notificacoesGeradas);
      setContadorNaoLidas(notificacoesGeradas.filter(n => !n.lida).length);
    } catch (error) {
      console.error('Erro ao verificar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const gerarNotificacoesAutomaticas = async (): Promise<NotificacaoContrato[]> => {
    const hoje = new Date();
    const em30Dias = addDays(hoje, 30);
    const em60Dias = addDays(hoje, 60);

    // Buscar contratos que podem gerar notificações
    const { data: contratos, error } = await supabase
      .from('contratos')
      .select(`
        id,
        numero_contrato,
        nome,
        data_fim,
        renovacao_automatica,
        prazo_renovacao,
        status
      `)
      .eq('status', 'ativo');

    if (error) throw error;

    const notificacoes: NotificacaoContrato[] = [];

    // Buscar marcos próximos
    const { data: marcos } = await supabase
      .from('contrato_marcos')
      .select(`
        id,
        nome,
        data_prevista,
        status,
        contrato_id,
        contratos!inner(numero_contrato, nome)
      `)
      .eq('status', 'pendente')
      .lte('data_prevista', format(em30Dias, 'yyyy-MM-dd'));

    if (marcos) {
      marcos.forEach(marco => {
        const diasRestantes = differenceInDays(new Date(marco.data_prevista), hoje);
        let prioridade: 'alta' | 'media' | 'baixa' = 'media';
        
        if (diasRestantes <= 7) prioridade = 'alta';
        else if (diasRestantes <= 15) prioridade = 'media';
        else prioridade = 'baixa';

        notificacoes.push({
          id: `marco-${marco.id}`,
          tipo: 'marco',
          prioridade,
          titulo: `Marco "${marco.nome}" próximo`,
          descricao: `Marco do contrato ${(marco.contratos as any).numero_contrato} vence em ${diasRestantes} dias`,
          data_alerta: marco.data_prevista,
          contrato_id: marco.contrato_id,
          lida: false,
          contrato: {
            numero_contrato: (marco.contratos as any).numero_contrato,
            nome: (marco.contratos as any).nome
          }
        });
      });
    }

    // Verificar contratos próximos do vencimento
    if (contratos) {
      contratos.forEach(contrato => {
        if (contrato.data_fim) {
          const dataFim = new Date(contrato.data_fim);
          const diasRestantes = differenceInDays(dataFim, hoje);

          if (diasRestantes <= 60 && diasRestantes >= 0) {
            let prioridade: 'alta' | 'media' | 'baixa' = 'media';
            
            if (diasRestantes <= 15) prioridade = 'alta';
            else if (diasRestantes <= 30) prioridade = 'media';
            else prioridade = 'baixa';

            notificacoes.push({
              id: `vencimento-${contrato.id}`,
              tipo: 'vencimento',
              prioridade,
              titulo: `Contrato ${contrato.numero_contrato} próximo do vencimento`,
              descricao: `Contrato "${contrato.nome}" vence em ${diasRestantes} dias`,
              data_alerta: contrato.data_fim,
              contrato_id: contrato.id,
              lida: false,
              contrato: {
                numero_contrato: contrato.numero_contrato,
                nome: contrato.nome
              }
            });

            // Notificação de renovação automática
            if (contrato.renovacao_automatica && diasRestantes <= (contrato.prazo_renovacao || 30)) {
              notificacoes.push({
                id: `renovacao-${contrato.id}`,
                tipo: 'renovacao',
                prioridade: 'media',
                titulo: `Renovação automática pendente`,
                descricao: `Contrato ${contrato.numero_contrato} será renovado automaticamente`,
                data_alerta: contrato.data_fim,
                contrato_id: contrato.id,
                lida: false,
                contrato: {
                  numero_contrato: contrato.numero_contrato,
                  nome: contrato.nome
                }
              });
            }
          }
        }
      });
    }

    return notificacoes.sort((a, b) => {
      // Ordenar por prioridade e depois por data
      const prioridadeOrder = { alta: 3, media: 2, baixa: 1 };
      if (prioridadeOrder[a.prioridade] !== prioridadeOrder[b.prioridade]) {
        return prioridadeOrder[b.prioridade] - prioridadeOrder[a.prioridade];
      }
      return new Date(a.data_alerta).getTime() - new Date(b.data_alerta).getTime();
    });
  };

  const marcarComoLida = async (notificacaoId: string) => {
    setNotificacoes(prev => 
      prev.map(n => 
        n.id === notificacaoId ? { ...n, lida: true } : n
      )
    );
    setContadorNaoLidas(prev => Math.max(0, prev - 1));
  };

  const marcarTodasComoLidas = () => {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    setContadorNaoLidas(0);
  };

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return <Badge variant="destructive">Alta</Badge>;
      case 'media':
        return <Badge variant="outline">Média</Badge>;
      case 'baixa':
        return <Badge variant="secondary">Baixa</Badge>;
      default:
        return <Badge variant="outline">Média</Badge>;
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'vencimento':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'marco':
        return <Calendar className="h-4 w-4 text-primary" />;
      case 'renovacao':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {contadorNaoLidas > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
            >
              {contadorNaoLidas > 99 ? '99+' : contadorNaoLidas}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notificações de Contratos</CardTitle>
              {contadorNaoLidas > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={marcarTodasComoLidas}
                >
                  Marcar todas como lidas
                </Button>
              )}
            </div>
            <CardDescription>
              {contadorNaoLidas} notificação(ões) não lida(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Carregando notificações...
              </div>
            ) : notificacoes.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Nenhuma notificação pendente
              </div>
            ) : (
              <div className="space-y-1">
                {notificacoes.map((notificacao) => (
                  <div
                    key={notificacao.id}
                    className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors ${
                      !notificacao.lida ? 'bg-muted/30' : ''
                    }`}
                    onClick={() => marcarComoLida(notificacao.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getTipoIcon(notificacao.tipo)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {notificacao.titulo}
                          </p>
                          {getPrioridadeBadge(notificacao.prioridade)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {notificacao.descricao}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(notificacao.data_alerta), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      {!notificacao.lida && (
                        <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}