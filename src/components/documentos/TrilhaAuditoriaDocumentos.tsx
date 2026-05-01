
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, User, Calendar, Edit, Plus, Trash, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { AkurisPulse } from '@/components/ui/AkurisPulse';
interface TrilhaAuditoriaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentoId: string;
  documentoNome: string;
}

interface AuditLog {
  id: string;
  action: string;
  old_values?: any;
  new_values?: any;
  changed_fields?: string[];
  created_at: string;
  user_id?: string;
  profiles?: {
    nome: string;
    email: string;
  } | null;
}

export function TrilhaAuditoriaDocumentos({ 
  open, 
  onOpenChange, 
  documentoId, 
  documentoNome 
}: TrilhaAuditoriaProps) {
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['documento-audit-logs', documentoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id,
          action,
          old_values,
          new_values,
          changed_fields,
          created_at,
          user_id,
          profiles(nome, email)
        `)
        .eq('table_name', 'documentos')
        .eq('record_id', documentoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Mapear dados para garantir tipagem correta
      const mappedData: AuditLog[] = (data || []).map(item => ({
        id: item.id,
        action: item.action,
        old_values: item.old_values,
        new_values: item.new_values,
        changed_fields: item.changed_fields,
        created_at: item.created_at,
        user_id: item.user_id,
        profiles: Array.isArray(item.profiles) && item.profiles.length > 0 
          ? item.profiles[0] 
          : null
      }));
      
      return mappedData;
    },
    enabled: open && !!documentoId,
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'UPDATE':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'DELETE':
        return <Trash className="h-4 w-4 text-red-600" />;
      default:
        return <Eye className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Badge className="bg-green-100 text-green-800">Criado</Badge>;
      case 'UPDATE':
        return <Badge className="bg-blue-100 text-blue-800">Atualizado</Badge>;
      case 'DELETE':
        return <Badge className="bg-red-100 text-red-800">Excluído</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const formatChangedFields = (fields?: string[]) => {
    if (!fields || fields.length === 0) return 'N/A';
    
    const fieldTranslations: Record<string, string> = {
      'nome': 'Nome',
      'descricao': 'Descrição',
      'tipo': 'Tipo',
      'categoria': 'Categoria',
      'status': 'Status',
      'confidencial': 'Confidencial',
      'data_vencimento': 'Data de Vencimento',
      'tags': 'Tags',
      'arquivo_url': 'Arquivo',
      'aprovado_por': 'Aprovado Por',
      'data_aprovacao': 'Data de Aprovação'
    };

    return fields
      .map(field => fieldTranslations[field] || field)
      .join(', ');
  };

  const formatJsonData = (data: any) => {
    if (!data) return 'N/A';
    
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const getValueDifference = (oldVal: any, newVal: any) => {
    if (oldVal === newVal) return null;
    
    return {
      old: oldVal || 'N/A',
      new: newVal || 'N/A'
    };
  };

  const renderValueComparison = (log: AuditLog) => {
    if (!log.old_values || !log.new_values) return null;

    const changes = log.changed_fields?.map(field => {
      const diff = getValueDifference(log.old_values[field], log.new_values[field]);
      if (!diff) return null;

      return (
        <div key={field} className="border rounded p-3">
          <h5 className="font-medium mb-2 capitalize">{field.replace('_', ' ')}</h5>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-red-50 p-2 rounded">
              <p className="text-xs font-medium text-red-800">Anterior</p>
              <p className="text-sm text-red-700">{String(diff.old)}</p>
            </div>
            <div className="bg-green-50 p-2 rounded">
              <p className="text-xs font-medium text-green-800">Novo</p>
              <p className="text-sm text-green-700">{String(diff.new)}</p>
            </div>
          </div>
        </div>
      );
    }).filter(Boolean);

    return changes;
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <AkurisPulse size={48} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Trilha de Auditoria - {documentoNome}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {!auditLogs || auditLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              Nenhum histórico de alterações encontrado.
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {auditLogs.map((log) => (
                  <Card key={log.id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <CardTitle className="text-lg">
                              Documento {log.action === 'INSERT' ? 'Criado' : 
                                       log.action === 'UPDATE' ? 'Atualizado' : 
                                       'Excluído'}
                            </CardTitle>
                            {getActionBadge(log.action)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {log.profiles?.nome || 'Sistema'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <Tabs defaultValue="resumo">
                        <TabsList>
                          <TabsTrigger value="resumo">Resumo</TabsTrigger>
                          {log.action === 'UPDATE' && (
                            <TabsTrigger value="comparacao">Comparação</TabsTrigger>
                          )}
                          {log.old_values && (
                            <TabsTrigger value="antes">Dados Anteriores</TabsTrigger>
                          )}
                          {log.new_values && (
                            <TabsTrigger value="depois">Dados Novos</TabsTrigger>
                          )}
                        </TabsList>

                        <TabsContent value="resumo" className="space-y-3">
                          <div className="grid grid-cols-1 gap-4 text-sm">
                            <div>
                              <strong>Campos Alterados:</strong>
                              <p className="text-muted-foreground">
                                {formatChangedFields(log.changed_fields)}
                              </p>
                            </div>
                            {log.profiles && (
                              <div>
                                <strong>Usuário:</strong>
                                <p className="text-muted-foreground">
                                  {log.profiles.nome} ({log.profiles.email})
                                </p>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        {log.action === 'UPDATE' && (
                          <TabsContent value="comparacao">
                            <div className="space-y-4">
                              {renderValueComparison(log)}
                            </div>
                          </TabsContent>
                        )}

                        {log.old_values && (
                          <TabsContent value="antes">
                            <div className="bg-red-50 p-4 rounded-md">
                              <h4 className="font-medium text-red-800 mb-2">Dados Anteriores</h4>
                              <pre className="text-xs text-red-700 overflow-x-auto whitespace-pre-wrap">
                                {formatJsonData(log.old_values)}
                              </pre>
                            </div>
                          </TabsContent>
                        )}

                        {log.new_values && (
                          <TabsContent value="depois">
                            <div className="bg-green-50 p-4 rounded-md">
                              <h4 className="font-medium text-green-800 mb-2">Dados Novos</h4>
                              <pre className="text-xs text-green-700 overflow-x-auto whitespace-pre-wrap">
                                {formatJsonData(log.new_values)}
                              </pre>
                            </div>
                          </TabsContent>
                        )}
                      </Tabs>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
