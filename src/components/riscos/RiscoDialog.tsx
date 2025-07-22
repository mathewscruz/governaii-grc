
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RiscoForm } from './RiscoForm';

interface RiscoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risco?: any;
  onSuccess: () => void;
}

export function RiscoDialog({ open, onOpenChange, risco, onSuccess }: RiscoDialogProps) {
  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {risco ? 'Editar Risco' : 'Novo Risco'}
          </DialogTitle>
          <DialogDescription>
            {risco 
              ? 'Modifique as informações do risco identificado.' 
              : 'Cadastre um novo risco organizacional com suas características de probabilidade e impacto.'
            }
          </DialogDescription>
        </DialogHeader>
        <RiscoForm risco={risco} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
