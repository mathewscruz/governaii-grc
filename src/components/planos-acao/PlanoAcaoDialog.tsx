import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { UserSelect } from '@/components/riscos/UserSelect';

interface PlanoAcaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  plano?: any;
  loading?: boolean;
}

const modulosOrigem = [
  { value: 'manual', label: 'Manual' },
  { value: 'riscos', label: 'Riscos' },
  { value: 'controles', label: 'Controles' },
  { value: 'frameworks', label: 'Frameworks' },
  { value: 'incidentes', label: 'Incidentes' },
  { value: 'auditorias', label: 'Auditorias' },
  { value: 'contratos', label: 'Contratos' },
  { value: 'documentos', label: 'Documentos' },
  { value: 'dados', label: 'Privacidade' },
  { value: 'due-diligence', label: 'Due Diligence' },
  { value: 'denuncia', label: 'Denúncia' },
  { value: 'ativos', label: 'Ativos' },
  { value: 'contas-privilegiadas', label: 'Contas Privilegiadas' },
];

export function PlanoAcaoDialog({ open, onOpenChange, onSave, plano, loading }: PlanoAcaoDialogProps) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState('pendente');
  const [prioridade, setPrioridade] = useState('media');
  const [responsavelId, setResponsavelId] = useState('');
  const [prazo, setPrazo] = useState<Date | undefined>();
  const [moduloOrigem, setModuloOrigem] = useState('manual');
  const [registroOrigemTitulo, setRegistroOrigemTitulo] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (plano) {
      setTitulo(plano.titulo || '');
      setDescricao(plano.descricao || '');
      setStatus(plano.status || 'pendente');
      setPrioridade(plano.prioridade || 'media');
      setResponsavelId(plano.responsavel_id || '');
      setPrazo(plano.prazo ? new Date(plano.prazo) : undefined);
      setModuloOrigem(plano.modulo_origem || 'manual');
      setRegistroOrigemTitulo(plano.registro_origem_titulo || '');
      setObservacoes(plano.observacoes || '');
    } else {
      setTitulo('');
      setDescricao('');
      setStatus('pendente');
      setPrioridade('media');
      setResponsavelId('');
      setPrazo(undefined);
      setModuloOrigem('manual');
      setRegistroOrigemTitulo('');
      setObservacoes('');
    }
  }, [plano, open]);

  const handleSave = () => {
    if (!titulo.trim()) return;
    onSave({
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      status,
      prioridade,
      responsavel_id: responsavelId || null,
      prazo: prazo ? format(prazo, 'yyyy-MM-dd') : null,
      modulo_origem: moduloOrigem,
      registro_origem_titulo: registroOrigemTitulo.trim() || null,
      observacoes: observacoes.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plano ? 'Editar Plano de Ação' : 'Novo Plano de Ação'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Descreva a ação necessária" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes da ação" rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Responsável</Label>
              <UserSelect value={responsavelId} onValueChange={setResponsavelId} />
            </div>
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !prazo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {prazo ? format(prazo, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={prazo} onSelect={setPrazo} locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Módulo de Origem</Label>
              <Select value={moduloOrigem} onValueChange={setModuloOrigem}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {modulosOrigem.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {moduloOrigem !== 'manual' && (
              <div className="space-y-2">
                <Label>Referência (título do item)</Label>
                <Input value={registroOrigemTitulo} onChange={(e) => setRegistroOrigemTitulo(e.target.value)} placeholder="Ex: Risco de vazamento de dados" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Notas adicionais" rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!titulo.trim() || loading}>
            {loading ? 'Salvando...' : plano ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
