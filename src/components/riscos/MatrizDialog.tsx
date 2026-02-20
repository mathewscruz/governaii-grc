
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Grid3X3 } from 'lucide-react';
import { MatrizForm } from './MatrizForm';
import { MatrizVisualizacao } from './MatrizVisualizacao';

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
          <DialogTitle>Matriz de Riscos</DialogTitle>
          <DialogDescription>
            Visualize e configure a matriz de risco da sua organização.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="visual" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="visual" className="flex-1 gap-2">
              <Grid3X3 className="h-4 w-4" />
              Matriz Visual
            </TabsTrigger>
            <TabsTrigger value="configuracao" className="flex-1 gap-2">
              <Settings className="h-4 w-4" />
              Configuração
            </TabsTrigger>
          </TabsList>
          <TabsContent value="visual" className="mt-4">
            <MatrizVisualizacao />
          </TabsContent>
          <TabsContent value="configuracao" className="mt-4">
            <MatrizForm onSuccess={handleSuccess} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
