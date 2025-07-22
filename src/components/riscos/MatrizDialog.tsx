
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MatrizForm } from './MatrizForm';

interface MatrizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MatrizDialog({ open, onOpenChange, onSuccess }: MatrizDialogProps) {
  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Matriz de Riscos</DialogTitle>
          <DialogDescription>
            Configure as matrizes de risco e categorias para classificação e avaliação dos riscos organizacionais.
          </DialogDescription>
        </DialogHeader>
        <MatrizForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
