import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileBarChart, Download, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDateOnly } from '@/lib/date-utils';
import jsPDF from 'jspdf';
import { loadAkurisLogo, addAkurisHeader, addAkurisFooter, addSectionTitle, drawTableHeader, formatLabel, AKURIS_COLORS } from '@/lib/pdf-utils';

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
      formatLabel(doc.tipo),
      doc.classificacao ? formatLabel(doc.classificacao) : "",
      formatLabel(doc.status),
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

  const gerarRelatorioGeral = async () => {
    setGerando('geral');
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      const logo = await loadAkurisLogo();
      let y = addAkurisHeader(doc, logo);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(AKURIS_COLORS.text);
      doc.text('Relatório Geral de Documentos', pageWidth / 2, y, { align: 'center' });
      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(AKURIS_COLORS.textLight);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} | Total: ${documentos.length} documentos`, pageWidth / 2, y, { align: 'center' });
      y += 12;

      const ativos = documentos.filter(d => d.status === 'ativo').length;
      const inativos = documentos.filter(d => d.status === 'inativo').length;
      const vencidos = documentos.filter(d => {
        if (!d.data_vencimento) return false;
        return new Date(d.data_vencimento) < new Date();
      }).length;

      y = addSectionTitle(doc, 'Resumo por Status', y, margin);
      doc.setFontSize(10);
      doc.setTextColor(AKURIS_COLORS.text);
      doc.text(`• Ativos: ${ativos}`, margin + 8, y); y += 6;
      doc.text(`• Inativos: ${inativos}`, margin + 8, y); y += 6;
      doc.text(`• Vencidos: ${vencidos}`, margin + 8, y); y += 10;

      y = addSectionTitle(doc, 'Lista de Documentos', y, margin);

      drawTableHeader(doc, [
        { text: 'Nome', x: margin + 2 },
        { text: 'Tipo', x: margin + 82 },
        { text: 'Status', x: margin + 118 },
        { text: 'Validade', x: margin + 148 },
      ], y, margin, contentWidth);
      y += 5;

      doc.setFont('helvetica', 'normal');
      documentos.forEach((d, i) => {
        if (y > pageHeight - 25) {
          doc.addPage();
          y = addAkurisHeader(doc, logo);
        }

        if (i % 2 === 0) {
          doc.setFillColor(248, 247, 255);
          doc.rect(margin, y - 3.5, contentWidth, 5.5, 'F');
        }

        doc.setFontSize(7);
        doc.setTextColor(AKURIS_COLORS.text);
        doc.text(d.nome.substring(0, 42), margin + 2, y);
        doc.text(formatLabel(d.tipo) || '', margin + 82, y);
        doc.text(formatLabel(d.status) || '', margin + 118, y);
        doc.text(d.data_vencimento ? formatDateOnly(d.data_vencimento) : '-', margin + 148, y);
        y += 5.5;
      });

      addAkurisFooter(doc);
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
