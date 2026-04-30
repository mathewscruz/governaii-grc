import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface TrilhaAuditoriaProps {
  ativoId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_values?: any;
  new_values?: any;
  changed_fields?: string[];
  created_at: string;
  profiles?: {
    nome: string;
    email: string;
  } | null;
}

const TrilhaAuditoriaAtivos: React.FC<TrilhaAuditoriaProps> = ({ ativoId, open, onOpenChange }) => {
  const [filtroAcao, setFiltroAcao] = useState<string>('');

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ['audit-logs-ativos', ativoId, filtroAcao],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:user_id (nome, email)
        `)
        .eq('table_name', 'ativos')
        .order('created_at', { ascending: false });

      if (ativoId) {
        query = query.eq('record_id', ativoId);
      }

      if (filtroAcao && filtroAcao !== 'ALL') {
        query = query.eq('action', filtroAcao);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        profiles: item.profiles && typeof item.profiles === 'object' && !Array.isArray(item.profiles) && 'nome' in item.profiles 
          ? item.profiles as { nome: string; email: string }
          : null
      })) as AuditLog[];
    },
    enabled: open,
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Badge variant="default">Criação</Badge>;
      case 'UPDATE':
        return <Badge variant="secondary">Atualização</Badge>;
      case 'DELETE':
        return <Badge variant="destructive">Exclusão</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const formatChangedFields = (fields?: string[]) => {
    if (!fields || fields.length === 0) return '-';
    return fields.join(', ');
  };

  const formatJsonData = (data: any) => {
    if (!data) return 'N/A';
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return 'Dados inválidos';
    }
  };

  const getFieldDisplayName = (fieldName: string) => {
    const fieldMap: { [key: string]: string } = {
      nome: 'Nome',
      tipo: 'Tipo',
      descricao: 'Descrição',
      proprietario: 'Proprietário',
      localizacao: 'Localização',
      valor_negocio: 'Valor de Negócio',
      criticidade: 'Criticidade',
      status: 'Status',
      data_aquisicao: 'Data de Aquisição',
      fornecedor: 'Fornecedor',
      versao: 'Versão',
      tags: 'Tags',
      imei: 'IMEI',
      cliente: 'Cliente',
      quantidade: 'Quantidade',
    };
    return fieldMap[fieldName] || fieldName;
  };

  const exportLogs = () => {
    const csvContent = [
      ['Data/Hora', 'Ação', 'Usuário', 'Campos Alterados', 'IP'].join(','),
      ...auditLogs.map(log => [
        new Date(log.created_at).toLocaleString('pt-BR'),
        log.action,
        log.profiles?.nome || 'Sistema',
        formatChangedFields(log.changed_fields),
        'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `auditoria-ativos-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Trilha de Auditoria - Ativos</DialogTitle>
          <DialogDescription>
            Visualize o histórico completo de alterações nos ativos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="filtro-acao">Filtrar por Ação</Label>
              <Select value={filtroAcao} onValueChange={setFiltroAcao}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas as ações</SelectItem>
                  <SelectItem value="INSERT">Criação</SelectItem>
                  <SelectItem value="UPDATE">Atualização</SelectItem>
                  <SelectItem value="DELETE">Exclusão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={exportLogs} variant="outline">
                Exportar Logs
              </Button>
            </div>
          </div>

          {/* Lista de Logs */}
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum log de auditoria encontrado
              </div>
            ) : (
              <div className="space-y-4">
                {auditLogs.map((log) => (
                  <Card key={log.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getActionBadge(log.action)}
                          <CardTitle className="text-base">
                            {log.action === 'INSERT' ? 'Ativo Criado' :
                             log.action === 'UPDATE' ? 'Ativo Atualizado' :
                             log.action === 'DELETE' ? 'Ativo Excluído' : log.action}
                          </CardTitle>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <CardDescription>
                        Por: {log.profiles?.nome || 'Sistema'} ({log.profiles?.email || 'N/A'})
                        {log.changed_fields && log.changed_fields.length > 0 && (
                          <span className="ml-2">
                            • Campos alterados: {log.changed_fields.map(getFieldDisplayName).join(', ')}
                          </span>
                        )}
                      </CardDescription>
                    </CardHeader>

                    {(log.old_values || log.new_values) && (
                      <CardContent>
                        <Tabs defaultValue="resumo" className="w-full">
                          <TabsList>
                            <TabsTrigger value="resumo">Resumo</TabsTrigger>
                            {log.old_values && <TabsTrigger value="anterior">Valores Anteriores</TabsTrigger>}
                            {log.new_values && <TabsTrigger value="novos">Novos Valores</TabsTrigger>}
                          </TabsList>

                          <TabsContent value="resumo" className="space-y-2">
                            <div className="text-sm">
                              <strong>Ação:</strong> {log.action === 'INSERT' ? 'Criação de novo ativo' :
                                                    log.action === 'UPDATE' ? 'Atualização de ativo existente' :
                                                    log.action === 'DELETE' ? 'Exclusão de ativo' : log.action}
                            </div>
                            {log.changed_fields && log.changed_fields.length > 0 && (
                              <div className="text-sm">
                                <strong>Campos modificados:</strong>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {log.changed_fields.map((field) => (
                                    <Badge key={field} variant="outline" className="text-xs">
                                      {getFieldDisplayName(field)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </TabsContent>

                          {log.old_values && (
                            <TabsContent value="anterior">
                              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                                {formatJsonData(log.old_values)}
                              </pre>
                            </TabsContent>
                          )}

                          {log.new_values && (
                            <TabsContent value="novos">
                              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                                {formatJsonData(log.new_values)}
                              </pre>
                            </TabsContent>
                          )}
                        </Tabs>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrilhaAuditoriaAtivos;