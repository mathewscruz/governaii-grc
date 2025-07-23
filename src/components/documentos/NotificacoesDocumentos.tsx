
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { addDays, differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificacaoDocumento {
  id: string;
  nome: string;
  data_vencimento: string;
  status: string;
  tipo: string;
  categoria?: string;
  diasParaVencimento: number;
}

export function NotificacoesDocumentos() {
  const { toast } = useToast();

  const { data: documentosVencendo, isLoading } = useQuery({
    queryKey: ['documentos-vencendo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documentos')
        .select('id, nome, data_vencimento, status, tipo, categoria')
        .not('data_vencimento', 'is', null)
        .eq('status', 'ativo')
        .order('data_vencimento', { ascending: true });

      if (error) throw error;

      const hoje = new Date();
      const documentosComDias = data
        .map(doc => ({
          ...doc,
          diasParaVencimento: differenceInDays(new Date(doc.data_vencimento!), hoje)
        }))
        .filter(doc => doc.diasParaVencimento <= 30); // Próximos 30 dias

      return documentosComDias as NotificacaoDocumento[];
    },
  });

  const createNotification = async (documento: NotificacaoDocumento, tipo: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          title: `Documento ${tipo}`,
          message: `O documento "${documento.nome}" ${tipo === 'vencido' ? 'está vencido' : 'vence em breve'}`,
          type: tipo === 'vencido' ? 'error' : 'warning',
          link_to: '/documentos',
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
    }
  };

  const categorizeDocuments = (docs: NotificacaoDocumento[]) => {
    const vencidos = docs.filter(doc => doc.diasParaVencimento < 0);
    const vencendoHoje = docs.filter(doc => doc.diasParaVencimento === 0);
    const vencendo7Dias = docs.filter(doc => doc.diasParaVencimento > 0 && doc.diasParaVencimento <= 7);
    const vencendo30Dias = docs.filter(doc => doc.diasParaVencimento > 7 && doc.diasParaVencimento <= 30);

    return { vencidos, vencendoHoje, vencendo7Dias, vencendo30Dias };
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (!documentosVencendo || documentosVencendo.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Nenhuma notificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Todos os documentos estão em dia!
          </p>
        </CardContent>
      </Card>
    );
  }

  const { vencidos, vencendoHoje, vencendo7Dias, vencendo30Dias } = categorizeDocuments(documentosVencendo);

  const NotificationCard = ({ 
    title, 
    icon, 
    variant, 
    documents 
  }: { 
    title: string;
    icon: React.ReactNode;
    variant: 'destructive' | 'warning' | 'secondary';
    documents: NotificacaoDocumento[];
  }) => (
    <Card className={`border-l-4 ${
      variant === 'destructive' ? 'border-l-red-500' : 
      variant === 'warning' ? 'border-l-yellow-500' : 
      'border-l-blue-500'
    }`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title} ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {documents.slice(0, 5).map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded">
              <div className="flex-1">
                <p className="font-medium">{doc.nome}</p>
                <p className="text-sm text-muted-foreground">
                  Vence em: {format(new Date(doc.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{doc.tipo}</Badge>
                <Badge variant={
                  doc.diasParaVencimento < 0 ? 'destructive' :
                  doc.diasParaVencimento <= 7 ? 'default' : 'secondary'
                }>
                  {doc.diasParaVencimento < 0 
                    ? `${Math.abs(doc.diasParaVencimento)} dias atraso`
                    : doc.diasParaVencimento === 0 
                    ? 'Hoje'
                    : `${doc.diasParaVencimento} dias`
                  }
                </Badge>
              </div>
            </div>
          ))}
          {documents.length > 5 && (
            <p className="text-sm text-muted-foreground text-center">
              E mais {documents.length - 5} documento(s)...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {vencidos.length > 0 && (
        <NotificationCard
          title="Documentos Vencidos"
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          variant="destructive"
          documents={vencidos}
        />
      )}

      {vencendoHoje.length > 0 && (
        <NotificationCard
          title="Vencem Hoje"
          icon={<Clock className="h-5 w-5 text-yellow-600" />}
          variant="warning"
          documents={vencendoHoje}
        />
      )}

      {vencendo7Dias.length > 0 && (
        <NotificationCard
          title="Vencem em 7 Dias"
          icon={<Bell className="h-5 w-5 text-blue-600" />}
          variant="secondary"
          documents={vencendo7Dias}
        />
      )}

      {vencendo30Dias.length > 0 && (
        <NotificationCard
          title="Vencem em 30 Dias"
          icon={<Bell className="h-5 w-5 text-gray-600" />}
          variant="secondary"
          documents={vencendo30Dias}
        />
      )}
    </div>
  );
}
