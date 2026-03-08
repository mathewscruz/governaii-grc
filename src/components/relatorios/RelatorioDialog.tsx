import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RelatorioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  relatorio?: any;
  loading?: boolean;
}

export function RelatorioDialog({ open, onOpenChange, onSave, relatorio, loading }: RelatorioDialogProps) {
  const [nome, setNome] = useState(relatorio?.nome || '');
  const [descricao, setDescricao] = useState(relatorio?.descricao || '');
  const [templateBase, setTemplateBase] = useState(relatorio?.template_base || '');

  useEffect(() => {
    if (open) {
      setNome(relatorio?.nome || '');
      setDescricao(relatorio?.descricao || '');
      setTemplateBase(relatorio?.template_base || '');
    }
  }, [open, relatorio]);

  const handleSave = () => {
    if (!nome.trim()) return;
    onSave({
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      template_base: templateBase || null,
      tipo: templateBase ? 'template' : 'customizado',
      configuracao: relatorio?.configuracao || { widgets: [] },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{relatorio ? 'Editar Relatório' : 'Novo Relatório'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do relatório" />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição do relatório" rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Template Base (opcional)</Label>
            <Select value={templateBase} onValueChange={setTemplateBase}>
              <SelectTrigger><SelectValue placeholder="Selecionar template..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhum">Nenhum (customizado)</SelectItem>
                <SelectItem value="lgpd_anpd">Relatório LGPD para ANPD</SelectItem>
                <SelectItem value="iso27001_auditoria">Status ISO 27001 para Auditoria</SelectItem>
                <SelectItem value="executivo_trimestral">Resumo Executivo Trimestral</SelectItem>
                <SelectItem value="riscos_geral">Panorama de Riscos</SelectItem>
                <SelectItem value="incidentes_periodo">Incidentes por Período</SelectItem>
                <SelectItem value="compliance_geral">Status Geral de Compliance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!nome.trim() || loading}>
            {loading ? 'Salvando...' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
