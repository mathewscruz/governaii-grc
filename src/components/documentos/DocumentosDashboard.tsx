import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, XCircle, Clock, TrendingUp, Users, FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Documento {
  id: string;
  tipo: string;
  status: string;
  data_vencimento?: string;
  data_aprovacao?: string;
  categoria?: string;
}

interface Categoria {
  id: string;
  nome: string;
  cor: string;
}

interface DocumentosDashboardProps {
  documentos: Documento[];
  categorias: Categoria[];
}

export function DocumentosDashboard({ documentos, categorias }: DocumentosDashboardProps) {
  const stats = {
    total: documentos.length,
    ativos: documentos.filter(d => d.status === 'ativo').length,
    vencidos: documentos.filter(d => d.data_vencimento && new Date(d.data_vencimento) < new Date()).length,
    aprovados: documentos.filter(d => d.data_aprovacao).length,
  };

  const documentosPorTipo = documentos.reduce((acc, doc) => {
    acc[doc.tipo] = (acc[doc.tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const documentosPorCategoria = documentos.reduce((acc, doc) => {
    const categoria = doc.categoria || 'Sem categoria';
    acc[categoria] = (acc[categoria] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.ativos} ativos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aprovados}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.aprovados / stats.total) * 100)}% do total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vencidos}</div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categorias.length}</div>
            <p className="text-xs text-muted-foreground">
              Categorias ativas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Documentos por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(documentosPorTipo).map(([tipo, quantidade]) => (
                <div key={tipo} className="flex items-center justify-between">
                  <span className="capitalize">{tipo}</span>
                  <Badge variant="secondary">{quantidade}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documentos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(documentosPorCategoria).map(([categoria, quantidade]) => (
                <div key={categoria} className="flex items-center justify-between">
                  <span>{categoria}</span>
                  <Badge variant="outline">{quantidade}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}