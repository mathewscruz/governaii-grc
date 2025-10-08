
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RiscoFormWizard } from './RiscoFormWizard';

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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <DialogTitle>
            {risco ? 'Editar Risco' : 'Novo Risco'}
          </DialogTitle>
          <DialogDescription>
            {risco 
              ? 'Atualize as informações do risco conforme necessário.' 
              : 'Preencha os campos abaixo para cadastrar um novo risco. Você pode preencher na ordem que preferir.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <RiscoFormWizard risco={risco} onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
