
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { TratamentoForm } from './TratamentoForm';

interface TratamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riscoId: string;
  tratamento?: any;
  onSuccess: () => void;
  riscoData?: {
    nome: string;
    descricao: string;
    categoria?: string;
    nivel_risco_inicial?: string;
  };
}

export function TratamentoDialog({ open, onOpenChange, riscoId, tratamento, onSuccess, riscoData }: TratamentoDialogProps) {
  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {tratamento ? 'Editar Tratamento' : 'Novo Tratamento'}
          </DialogTitle>
          <DialogDescription>
            {tratamento 
              ? 'Modifique as informações do tratamento do risco.' 
              : 'Cadastre um novo tratamento para mitigar, transferir, aceitar ou evitar o risco identificado.'
            }
          </DialogDescription>
        </DialogHeader>
        <TratamentoForm 
          riscoId={riscoId} 
          tratamento={tratamento} 
          onSuccess={handleSuccess}
          riscoData={riscoData}
        />
      </DialogContent>
    </Dialog>
  );
}
