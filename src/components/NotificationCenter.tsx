
import React, { useState } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { differenceInDays } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: string;
  read: boolean;
  link_to: string | null;
  created_at: string;
  isAutomatic?: boolean;
}

const STORAGE_KEY = 'readAutomaticNotifications';

const getReadAutomaticNotifications = (): Set<string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const markAutomaticNotificationAsRead = (notificationId: string) => {
  try {
    const readNotifications = getReadAutomaticNotifications();
    readNotifications.add(notificationId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...readNotifications]));
  } catch (error) {
    console.error('Erro ao salvar notificação como lida:', error);
  }
};

const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [readAutomaticIds, setReadAutomaticIds] = useState<Set<string>>(getReadAutomaticNotifications());

  // Buscar notificações manuais
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Buscar todas as notificações automáticas do sistema
  const { data: automaticNotifications = [] } = useQuery({
    queryKey: ['automatic-notifications', [...readAutomaticIds]],
    queryFn: async () => {
      const notificacoes: Notification[] = [];
      const readIds = readAutomaticIds;
      
      // Buscar documentos vencendo
      const { data: documentos } = await supabase
        .from('documentos')
        .select('id, nome, data_vencimento, tipo')
        .not('data_vencimento', 'is', null)
        .eq('status', 'ativo');

      // Buscar contratos vencendo
      const { data: contratos } = await supabase
        .from('contratos')
        .select('id, nome, data_fim, renovacao_automatica')
        .not('data_fim', 'is', null)
        .eq('status', 'ativo');

      // Buscar controles para avaliação
      const { data: controles } = await supabase
        .from('controles')
        .select('id, nome, proxima_avaliacao')
        .not('proxima_avaliacao', 'is', null)
        .eq('status', 'ativo');

      // Buscar incidentes críticos abertos
      const { data: incidentes } = await supabase
        .from('incidentes')
        .select('id, titulo, criticidade, status')
        .in('status', ['aberto', 'investigacao'])
        .eq('criticidade', 'critica');

       // Buscar ativos críticos e manutenções pendentes
       const { data: ativos } = await supabase
         .from('ativos')
         .select('id, nome, criticidade, status')
         .eq('criticidade', 'critico')
         .eq('status', 'ativo');

       const { data: manutencoesPendentes } = await supabase
         .from('ativos_manutencoes')
         .select('id, ativo_id, data_manutencao, tipo_manutencao, ativos(nome)')
         .in('status', ['agendada', 'em_andamento'])
         .not('data_manutencao', 'is', null);

       // Buscar solicitações de aprovação de documentos pendentes
       const { data: aprovacoesDocumentos } = await supabase
         .from('documentos_aprovacoes')
         .select('id, documento_id, status, tipo_acao, solicitado_por, created_at, documentos(nome), profiles(nome)')
         .eq('aprovador_id', user?.id || '')
         .eq('status', 'pendente')
         .eq('tipo_acao', 'solicitacao');

      const hoje = new Date();

      // Processar documentos
      (documentos || []).forEach(doc => {
        const diasParaVencimento = differenceInDays(new Date(doc.data_vencimento!), hoje);
        
        if (diasParaVencimento < 0) {
          notificacoes.push({
            id: `doc-vencido-${doc.id}`,
            title: 'Documento Vencido',
            message: `O documento "${doc.nome}" está vencido há ${Math.abs(diasParaVencimento)} dias`,
            type: 'error',
            read: false,
            link_to: '/documentos',
            created_at: new Date().toISOString(),
            isAutomatic: true
          });
        } else if (diasParaVencimento === 0) {
          notificacoes.push({
            id: `doc-hoje-${doc.id}`,
            title: 'Documento Vence Hoje',
            message: `O documento "${doc.nome}" vence hoje`,
            type: 'warning',
            read: false,
            link_to: '/documentos',
            created_at: new Date().toISOString(),
            isAutomatic: true
          });
        } else if (diasParaVencimento <= 7) {
          notificacoes.push({
            id: `doc-7dias-${doc.id}`,
            title: 'Documento Vence em Breve',
            message: `O documento "${doc.nome}" vence em ${diasParaVencimento} dias`,
            type: 'warning',
            read: false,
            link_to: '/documentos',
            created_at: new Date().toISOString(),
            isAutomatic: true
          });
        }
      });

      // Processar contratos
      (contratos || []).forEach(contrato => {
        const diasParaVencimento = differenceInDays(new Date(contrato.data_fim!), hoje);
        
        if (diasParaVencimento < 0) {
          notificacoes.push({
            id: `contrato-vencido-${contrato.id}`,
            title: 'Contrato Vencido',
            message: `O contrato "${contrato.nome}" venceu há ${Math.abs(diasParaVencimento)} dias`,
            type: 'error',
            read: false,
            link_to: '/contratos',
            created_at: new Date().toISOString(),
            isAutomatic: true
          });
        } else if (diasParaVencimento <= 30) {
          const renovacaoMsg = contrato.renovacao_automatica ? ' (renovação automática ativada)' : '';
          notificacoes.push({
            id: `contrato-30dias-${contrato.id}`,
            title: 'Contrato Próximo ao Vencimento',
            message: `O contrato "${contrato.nome}" vence em ${diasParaVencimento} dias${renovacaoMsg}`,
            type: 'warning',
            read: false,
            link_to: '/contratos',
            created_at: new Date().toISOString(),
            isAutomatic: true
          });
        }
      });

      // Processar controles
      (controles || []).forEach(controle => {
        const diasParaAvaliacao = differenceInDays(new Date(controle.proxima_avaliacao!), hoje);
        
        if (diasParaAvaliacao <= 15 && diasParaAvaliacao >= 0) {
          notificacoes.push({
            id: `controle-avaliacao-${controle.id}`,
            title: 'Avaliação de Controle Pendente',
            message: `O controle "${controle.nome}" precisa ser avaliado em ${diasParaAvaliacao} dias`,
            type: 'warning',
            read: false,
            link_to: `/controles?detalhe=${controle.id}`,
            created_at: new Date().toISOString(),
            isAutomatic: true
          });
        }
      });

      // Processar incidentes críticos
      (incidentes || []).forEach(incidente => {
        notificacoes.push({
          id: `incidente-critico-${incidente.id}`,
          title: 'Incidente Crítico Aberto',
          message: `O incidente "${incidente.titulo}" está ${incidente.status} e requer atenção imediata`,
          type: 'error',
          read: false,
          link_to: `/incidentes?detalhe=${incidente.id}`,
          created_at: new Date().toISOString(),
          isAutomatic: true
        });
      });

      // Processar ativos críticos
      (ativos || []).forEach(ativo => {
        notificacoes.push({
          id: `ativo-critico-${ativo.id}`,
          title: 'Ativo Crítico Ativo',
          message: `O ativo "${ativo.nome}" está marcado como crítico e requer atenção especial`,
          type: 'warning',
          read: false,
          link_to: '/ativos',
          created_at: new Date().toISOString(),
          isAutomatic: true
        });
      });

      // Buscar empresa_id do usuário
      const { data: profileData } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('user_id', user!.id)
        .single();
      const userEmpresaId = profileData?.empresa_id;

      // Buscar licenças vencendo/vencidas
      const { data: licencas } = await supabase
        .from('ativos_licencas')
        .select('id, nome, data_vencimento, tipo_licenca')
        .eq('status', 'ativa')
        .eq('empresa_id', userEmpresaId || '')
        .not('data_vencimento', 'is', null);

      (licencas || []).forEach(licenca => {
        const diasParaVencimento = differenceInDays(new Date(licenca.data_vencimento), hoje);
        
        if (diasParaVencimento < 0) {
          notificacoes.push({
            id: `licenca-vencida-${licenca.id}`,
            title: 'Licença Vencida',
            message: `A licença "${licenca.nome}" venceu há ${Math.abs(diasParaVencimento)} dias`,
            type: 'error',
            read: false,
            link_to: '/ativos/licencas',
            created_at: new Date().toISOString(),
            isAutomatic: true
          });
        } else if (diasParaVencimento <= 30) {
          notificacoes.push({
            id: `licenca-vencendo-${licenca.id}`,
            title: 'Licença Vencendo',
            message: `A licença "${licenca.nome}" vence em ${diasParaVencimento} dias`,
            type: 'warning',
            read: false,
            link_to: '/ativos/licencas',
            created_at: new Date().toISOString(),
            isAutomatic: true
          });
        }
      });

      // Buscar chaves expiradas/próximas da rotação
      const { data: chaves } = await supabase
        .from('ativos_chaves_criptograficas')
        .select('id, nome, data_proxima_rotacao, tipo_chave, ambiente')
        .eq('status', 'ativa')
        .not('data_proxima_rotacao', 'is', null);

      (chaves || []).forEach(chave => {
        const diasParaRotacao = differenceInDays(new Date(chave.data_proxima_rotacao), hoje);
        
        if (diasParaRotacao < 0) {
          notificacoes.push({
            id: `chave-expirada-${chave.id}`,
            title: 'Chave Expirada',
            message: `A chave "${chave.nome}" (${chave.ambiente}) expirou há ${Math.abs(diasParaRotacao)} dias`,
            type: 'error',
            read: false,
            link_to: '/ativos/chaves',
            created_at: new Date().toISOString(),
            isAutomatic: true
          });
        } else if (diasParaRotacao <= 30) {
          notificacoes.push({
            id: `chave-rotacao-${chave.id}`,
            title: 'Rotação de Chave Necessária',
            message: `A chave "${chave.nome}" precisa ser rotacionada em ${diasParaRotacao} dias`,
            type: 'warning',
            read: false,
            link_to: '/ativos/chaves',
            created_at: new Date().toISOString(),
            isAutomatic: true
          });
        }
      });

      // Processar manutenções pendentes
      (manutencoesPendentes || []).forEach(manutencao => {
        const diasParaManutencao = differenceInDays(new Date(manutencao.data_manutencao!), hoje);
        
        if (diasParaManutencao <= 7 && diasParaManutencao >= 0) {
          notificacoes.push({
            id: `manutencao-${manutencao.id}`,
            title: 'Manutenção Agendada',
            message: `Manutenção ${manutencao.tipo_manutencao} do ativo "${(manutencao as any).ativos?.nome}" agendada para ${diasParaManutencao === 0 ? 'hoje' : `${diasParaManutencao} dias`}`,
            type: 'warning',
            read: false,
            link_to: '/ativos',
            created_at: new Date().toISOString(),
            isAutomatic: true
          });
         }
       });

      // Buscar riscos com revisão vencida ou próxima
      const { data: riscosRevisao } = await supabase
        .from('riscos')
        .select('id, nome, data_proxima_revisao, nivel_risco_inicial')
        .not('data_proxima_revisao', 'is', null);

      (riscosRevisao || []).forEach(risco => {
        const diasParaRevisao = differenceInDays(new Date(risco.data_proxima_revisao!), hoje);
        
        if (diasParaRevisao < 0) {
          notificacoes.push({
            id: `risco-revisao-vencida-${risco.id}`,
            title: 'Revisão de Risco Vencida',
            message: `O risco "${risco.nome}" (${risco.nivel_risco_inicial || 'N/A'}) está com revisão atrasada há ${Math.abs(diasParaRevisao)} dias`,
            type: 'error',
            read: false,
            link_to: '/riscos',
            created_at: new Date().toISOString(),
            isAutomatic: true
          });
        } else if (diasParaRevisao <= 7) {
          notificacoes.push({
            id: `risco-revisao-proxima-${risco.id}`,
            title: 'Revisão de Risco Próxima',
            message: `O risco "${risco.nome}" precisa ser revisado em ${diasParaRevisao} dias`,
            type: 'warning',
            read: false,
            link_to: '/riscos',
            created_at: new Date().toISOString(),
            isAutomatic: true
          });
        }
      });

       // Processar solicitações de aprovação de documentos
       (aprovacoesDocumentos || []).forEach(aprovacao => {
         const solicitanteNome = (aprovacao as any).profiles?.nome || 'Usuário';
         const documentoNome = (aprovacao as any).documentos?.nome || 'Documento';
         
         notificacoes.push({
           id: `aprovacao-doc-${aprovacao.id}`,
           title: 'Solicitação de Aprovação',
           message: `${solicitanteNome} solicitou sua aprovação para o documento "${documentoNome}"`,
           type: 'info',
           read: false,
           link_to: `/documentos?aprovar=${aprovacao.documento_id}`,
           created_at: aprovacao.created_at,
           isAutomatic: true
         });
       });

       // Marcar como lidas as notificações que estão no localStorage
       return notificacoes.map(notif => ({
         ...notif,
         read: readIds.has(notif.id)
       }));
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Combinar notificações manuais e automáticas, priorizando por severidade
  const typePriority: Record<string, number> = { error: 0, warning: 1, info: 2, success: 3 };
  const allNotifications = [...notifications, ...automaticNotifications]
    .sort((a, b) => {
      // Não lidas primeiro
      if (!a.read && b.read) return -1;
      if (a.read && !b.read) return 1;
      // Dentro do mesmo status de leitura, priorizar por severidade
      const prioDiff = (typePriority[a.type] ?? 4) - (typePriority[b.type] ?? 4);
      if (prioDiff !== 0) return prioDiff;
      // Mesma severidade, mais recente primeiro
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 30);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar a notificação como lida',
        variant: 'destructive',
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      // Marcar manuais como lidas
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleMarkAllAsRead = () => {
    // Marcar automáticas como lidas via localStorage
    const unreadAutomatic = automaticNotifications.filter(n => !n.read);
    unreadAutomatic.forEach(n => markAutomaticNotificationAsRead(n.id));
    setReadAutomaticIds(prev => {
      const newSet = new Set(prev);
      unreadAutomatic.forEach(n => newSet.add(n.id));
      return newSet;
    });
    queryClient.invalidateQueries({ queryKey: ['automatic-notifications'] });

    // Marcar manuais como lidas
    markAllAsReadMutation.mutate();
  };

  const unreadCount = allNotifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    // Marcar como lida se ainda não foi lida
    if (!notification.read) {
      if (notification.isAutomatic) {
        // Para notificações automáticas, salvar no localStorage
        markAutomaticNotificationAsRead(notification.id);
        setReadAutomaticIds(prev => {
          const newSet = new Set(prev);
          newSet.add(notification.id);
          return newSet;
        });
        // Invalidar query para atualizar a lista
        queryClient.invalidateQueries({ queryKey: ['automatic-notifications'] });
      } else {
        // Para notificações manuais, atualizar no banco de dados
        markAsReadMutation.mutate(notification.id);
      }
    }

    if (notification.link_to) {
      navigate(notification.link_to);
      setIsOpen(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificações</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={handleMarkAllAsRead}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Marcar todas
                </Button>
                <Badge variant="secondary">{unreadCount} não lidas</Badge>
              </>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-80">
          {!user ? (
            <div className="p-4 text-center text-muted-foreground">
              Faça login para ver notificações
            </div>
          ) : isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Carregando...
            </div>
          ) : allNotifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            <div className="space-y-1">
              {allNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-medium truncate ${
                          !notification.read ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0" />
                        )}
                      </div>
                      
                      {notification.message && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getTypeColor(notification.type)}`}>
                          {notification.type === 'error' ? 'Urgente' : 
                           notification.type === 'warning' ? 'Atenção' : 
                           notification.type === 'success' ? 'Sucesso' : 'Info'}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          {notification.link_to && (
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {!notification.read && !notification.isAutomatic && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsReadMutation.mutate(notification.id);
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
