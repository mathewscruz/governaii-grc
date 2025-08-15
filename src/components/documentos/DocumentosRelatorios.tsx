import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileBarChart, Download, Filter } from 'lucide-react';

interface Documento {
  id: string;
  nome: string;
  tipo: string;
  status: string;
}

interface Categoria {
  id: string;
  nome: string;
}

interface DocumentosRelatoriosProps {
  documentos: Documento[];
  categorias: Categoria[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentosRelatorios({ documentos, categorias, open, onOpenChange }: DocumentosRelatoriosProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Relatórios de Documentos</DialogTitle>
          <DialogDescription>
            Gere relatórios específicos dos documentos do sistema
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileBarChart className="h-5 w-5" />
                  Relatório Geral
                </CardTitle>
                <CardDescription>
                  Visão geral de todos os documentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Documentos Vencidos
                </CardTitle>
                <CardDescription>
                  Relatório de documentos vencidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileBarChart className="h-5 w-5" />
                  Por Categoria
                </CardTitle>
                <CardDescription>
                  Relatório agrupado por categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}