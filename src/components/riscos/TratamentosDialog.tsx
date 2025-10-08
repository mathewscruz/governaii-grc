import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { TratamentosList } from './TratamentosList';

interface TratamentosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risco: any;
  onSuccess: () => void;
}

export function TratamentosDialog({ open, onOpenChange, risco, onSuccess }: TratamentosDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <DialogTitle>
            Tratamentos do Risco: {risco?.nome}
          </DialogTitle>
          <DialogDescription>
            Gerencie os tratamentos associados a este risco. Adicione, edite ou remova ações de mitigação.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <TratamentosList 
            riscoId={risco?.id} 
            riscoNome={risco?.nome}
            riscoData={{
              nome: risco?.nome,
              descricao: risco?.descricao || '',
              categoria: risco?.categoria?.nome,
              nivel_risco_inicial: risco?.nivel_risco_inicial
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
