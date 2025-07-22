import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { History, User, Calendar, FileText, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface AuditoriaDialogProps {
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
  user_id?: string;
  profiles?: {
    nome: string;
    email: string;
  };
}

export function AuditoriaDialog({ open, onOpenChange }: AuditoriaDialogProps) {
  const [filtroTabela, setFiltroTabela] = useState<string>("todas");
  const [filtroAcao, setFiltroAcao] = useState<string>("todas");

  // Buscar logs de auditoria
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs', filtroTabela, filtroAcao],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:user_id(nome, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filtroTabela !== 'todas') {
        query = query.eq('table_name', filtroTabela);
      }

      if (filtroAcao !== 'todas') {
        query = query.eq('action', filtroAcao);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as any;
    }
  });

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

  const getTableDisplayName = (tableName: string) => {
    const tableNames: Record<string, string> = {
      'controles': 'Controles',
      'controles_testes': 'Testes de Controles',
      'riscos': 'Riscos',
      'ativos': 'Ativos',
      'profiles': 'Perfis de Usuário'
    };
    return tableNames[tableName] || tableName;
  };

  const formatChangedFields = (fields?: string[]) => {
    if (!fields || fields.length === 0) return 'N/A';
    return fields.map(field => field.charAt(0).toUpperCase() + field.slice(1)).join(', ');
  };

  const formatJsonData = (data: any) => {
    if (!data) return 'N/A';
    
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Trilha de Auditoria
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filtros */}
          <div className="flex gap-4">
            <Select value={filtroTabela} onValueChange={setFiltroTabela}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tabela" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Tabelas</SelectItem>
                <SelectItem value="controles">Controles</SelectItem>
                <SelectItem value="controles_testes">Testes</SelectItem>
                <SelectItem value="riscos">Riscos</SelectItem>
                <SelectItem value="ativos">Ativos</SelectItem>
                <SelectItem value="profiles">Perfis</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroAcao} onValueChange={setFiltroAcao}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Ações</SelectItem>
                <SelectItem value="INSERT">Criação</SelectItem>
                <SelectItem value="UPDATE">Atualização</SelectItem>
                <SelectItem value="DELETE">Exclusão</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Logs */}
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="text-center py-8">Carregando logs de auditoria...</div>
            ) : auditLogs?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                Nenhum log de auditoria encontrado.
              </div>
            ) : (
              <div className="space-y-4">
                {auditLogs?.map((log) => (
                  <Card key={log.id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">
                              {getTableDisplayName(log.table_name)}
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
                              {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <Tabs defaultValue="resumo">
                        <TabsList>
                          <TabsTrigger value="resumo">Resumo</TabsTrigger>
                          {log.old_values && (
                            <TabsTrigger value="antes">Valores Anteriores</TabsTrigger>
                          )}
                          {log.new_values && (
                            <TabsTrigger value="depois">Valores Novos</TabsTrigger>
                          )}
                        </TabsList>

                        <TabsContent value="resumo" className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong>ID do Registro:</strong>
                              <p className="text-muted-foreground font-mono text-xs">
                                {log.record_id}
                              </p>
                            </div>
                            <div>
                              <strong>Campos Alterados:</strong>
                              <p className="text-muted-foreground">
                                {formatChangedFields(log.changed_fields)}
                              </p>
                            </div>
                          </div>
                        </TabsContent>

                        {log.old_values && (
                          <TabsContent value="antes">
                            <div className="bg-red-50 p-4 rounded-md">
                              <h4 className="font-medium text-red-800 mb-2">Valores Anteriores</h4>
                              <pre className="text-xs text-red-700 overflow-x-auto whitespace-pre-wrap">
                                {formatJsonData(log.old_values)}
                              </pre>
                            </div>
                          </TabsContent>
                        )}

                        {log.new_values && (
                          <TabsContent value="depois">
                            <div className="bg-green-50 p-4 rounded-md">
                              <h4 className="font-medium text-green-800 mb-2">Valores Novos</h4>
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
            )}
          </ScrollArea>

          {/* Exportar Logs */}
          <div className="flex justify-end">
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Exportar Logs
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}