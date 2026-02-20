import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileBarChart, Download, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDateOnly } from '@/lib/date-utils';
import jsPDF from 'jspdf';

interface Documento {
  id: string;
  nome: string;
  tipo: string;
  status: string;
  classificacao?: string;
  data_vencimento?: string;
  versao?: number;
  created_at?: string;
  descricao?: string;
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
  const [gerando, setGerando] = useState<string | null>(null);
  const { toast } = useToast();

  const exportCSV = (dados: Documento[], nomeArquivo: string) => {
    const headers = ["Nome", "Tipo", "Classificação", "Status", "Versão", "Validade", "Data Criação"];
    const rows = dados.map(doc => [
      doc.nome,
      doc.tipo,
      doc.classificacao || "",
      doc.status,
      doc.versao || 1,
      doc.data_vencimento ? formatDateOnly(doc.data_vencimento) : "",
      doc.created_at ? formatDateOnly(doc.created_at) : ""
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.join(";"))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${nomeArquivo}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const gerarRelatorioGeral = () => {
    setGerando('geral');
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Relatório Geral de Documentos', 14, 22);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
      doc.text(`Total de documentos: ${documentos.length}`, 14, 36);

      const ativos = documentos.filter(d => d.status === 'ativo').length;
      const inativos = documentos.filter(d => d.status === 'inativo').length;
      const vencidos = documentos.filter(d => {
        if (!d.data_vencimento) return false;
        return new Date(d.data_vencimento) < new Date();
      }).length;

      doc.setFontSize(12);
      doc.text('Resumo por Status', 14, 48);
      doc.setFontSize(10);
      doc.text(`• Ativos: ${ativos}`, 20, 56);
      doc.text(`• Inativos: ${inativos}`, 20, 62);
      doc.text(`• Vencidos: ${vencidos}`, 20, 68);

      // Tabela simplificada
      let y = 82;
      doc.setFontSize(12);
      doc.text('Lista de Documentos', 14, y);
      y += 10;
      doc.setFontSize(8);
      doc.text('Nome', 14, y);
      doc.text('Tipo', 90, y);
      doc.text('Status', 130, y);
      doc.text('Validade', 165, y);
      y += 2;
      doc.line(14, y, 196, y);
      y += 5;

      documentos.slice(0, 40).forEach(d => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(d.nome.substring(0, 40), 14, y);
        doc.text(d.tipo || '', 90, y);
        doc.text(d.status || '', 130, y);
        doc.text(d.data_vencimento ? formatDateOnly(d.data_vencimento) : '-', 165, y);
        y += 6;
      });

      doc.save(`relatorio_geral_documentos_${new Date().toISOString().split("T")[0]}.pdf`);
      toast({ title: "Relatório gerado", description: "O PDF foi baixado com sucesso." });
    } catch {
      toast({ title: "Erro", description: "Erro ao gerar relatório.", variant: "destructive" });
    } finally {
      setGerando(null);
    }
  };

  const gerarRelatorioVencidos = () => {
    setGerando('vencidos');
    try {
      const hoje = new Date();
      const vencidos = documentos.filter(d => d.data_vencimento && new Date(d.data_vencimento) < hoje);
      exportCSV(vencidos, 'documentos_vencidos');
      toast({
        title: "Relatório gerado",
        description: `${vencidos.length} documento(s) vencido(s) exportado(s) em CSV.`,
      });
    } catch {
      toast({ title: "Erro", description: "Erro ao gerar relatório.", variant: "destructive" });
    } finally {
      setGerando(null);
    }
  };

  const gerarRelatorioPorCategoria = () => {
    setGerando('categoria');
    try {
      exportCSV(documentos, 'documentos_por_categoria');
      toast({
        title: "Relatório gerado",
        description: `${documentos.length} documento(s) exportado(s) em CSV.`,
      });
    } catch {
      toast({ title: "Erro", description: "Erro ao gerar relatório.", variant: "destructive" });
    } finally {
      setGerando(null);
    }
  };

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
                  Visão geral de todos os documentos (PDF)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={gerarRelatorioGeral} disabled={gerando === 'geral'}>
                  <Download className="h-4 w-4 mr-2" />
                  {gerando === 'geral' ? 'Gerando...' : 'Gerar PDF'}
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
                  Relatório de documentos vencidos (CSV)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={gerarRelatorioVencidos} disabled={gerando === 'vencidos'}>
                  <Download className="h-4 w-4 mr-2" />
                  {gerando === 'vencidos' ? 'Gerando...' : 'Exportar CSV'}
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
                  Relatório agrupado por categoria (CSV)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={gerarRelatorioPorCategoria} disabled={gerando === 'categoria'}>
                  <Download className="h-4 w-4 mr-2" />
                  {gerando === 'categoria' ? 'Gerando...' : 'Exportar CSV'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
