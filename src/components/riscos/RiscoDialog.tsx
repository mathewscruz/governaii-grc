
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RiscoForm } from './RiscoForm';
import { TratamentosList } from './TratamentosList';

interface RiscoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risco?: any;
  onSuccess: () => void;
}

export function RiscoDialog({ open, onOpenChange, risco, onSuccess }: RiscoDialogProps) {
  const [activeTab, setActiveTab] = useState('risco');

  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  const handleRiscoFormSuccess = () => {
    // Não fecha o dialog para permitir navegação para tratamentos
    onSuccess();
    if (!risco) {
      // Se é um novo risco, muda para aba de tratamentos
      setActiveTab('tratamentos');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {risco ? 'Gerenciar Risco' : 'Novo Risco'}
          </DialogTitle>
          <DialogDescription>
            {risco 
              ? 'Gerencie as informações do risco e seus tratamentos.' 
              : 'Cadastre um novo risco organizacional e defina seus tratamentos.'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="risco">Informações do Risco</TabsTrigger>
            <TabsTrigger value="tratamentos" disabled={!risco}>
              Tratamentos {risco ? '' : '(Salve o risco primeiro)'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="risco" className="mt-6">
            <RiscoForm risco={risco} onSuccess={handleRiscoFormSuccess} />
          </TabsContent>

          <TabsContent value="tratamentos" className="mt-6">
            {risco && (
              <TratamentosList 
                riscoId={risco.id} 
                riscoNome={risco.nome}
                riscoData={{
                  nome: risco.nome,
                  descricao: risco.descricao || '',
                  categoria: risco.categoria?.nome,
                  nivel_risco_inicial: risco.nivel_risco_inicial
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
