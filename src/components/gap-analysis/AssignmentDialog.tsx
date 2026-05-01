import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface AssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId: string;
  requirementId: string;
}

export const AssignmentDialog = ({
  open,
  onOpenChange,
  assessmentId,
  requirementId
}: AssignmentDialogProps) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [dueDate, setDueDate] = useState<Date>();
  const [instructions, setInstructions] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();

  const { data: users } = useOptimizedQuery(
    async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, nome, email')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return { data: data || [], error: null };
    },
    [],
    {
      staleTime: 10 * 60 * 1000,
      cacheKey: 'active-users'
    }
  );

  const { data: currentAssignment } = useOptimizedQuery(
    async () => {
      if (!requirementId) return { data: null, error: null };
      
       const { data, error } = await supabase
        .from('gap_analysis_assignments')
        .select('*')
        .eq('assessment_id', assessmentId)
        .eq('requirement_id', requirementId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { data: data || null, error: null };
    },
    [assessmentId, requirementId],
    {
      staleTime: 2 * 60 * 1000,
      cacheKey: `gap-assignment-${assessmentId}-${requirementId}`
    }
  );

  const handleAssign = async () => {
    if (!selectedUser || !dueDate || !requirementId) return;

    setIsAssigning(true);
    try {
      const assignmentData = {
        assessment_id: assessmentId,
        requirement_id: requirementId,
        assigned_to: selectedUser,
        assigned_by: '', // Will be set by RLS
        prazo: dueDate.toISOString().split('T')[0],
        instrucoes: instructions || null,
        status: 'pendente'
      };

      if (currentAssignment) {
        const { error } = await supabase
          .from('gap_analysis_assignments')
          .update(assignmentData)
          .eq('id', currentAssignment.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('gap_analysis_assignments')
          .insert([assignmentData]);
        
        if (error) throw error;
      }

      toast({
        title: "Atribuição realizada",
        description: "O requisito foi atribuído com sucesso.",
      });

      onOpenChange(false);
    } catch (error) {
      logger.error('Erro ao atribuir requisito:', error);
      toast({
        title: "Erro ao atribuir",
        description: "Ocorreu um erro ao atribuir o requisito.",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveAssignment = async () => {
    if (!currentAssignment) return;

    try {
      const { error } = await supabase
        .from('gap_analysis_assignments')
        .delete()
        .eq('id', currentAssignment.id);

      if (error) throw error;

      toast({
        title: "Atribuição removida",
        description: "A atribuição foi removida com sucesso.",
      });

      onOpenChange(false);
    } catch (error) {
      logger.error('Erro ao remover atribuição:', error);
      toast({
        title: "Erro ao remover",
        description: "Ocorreu um erro ao remover a atribuição.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Atribuir Requisito
          </DialogTitle>
          <DialogDescription>
            Atribua este requisito para um usuário responsável.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {currentAssignment && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">Atribuição Atual:</div>
              <div className="text-sm text-muted-foreground">
                <div>Responsável: {currentAssignment.assigned_to}</div>
                <div>Prazo: {new Date(currentAssignment.prazo).toLocaleDateString()}</div>
                <div>Status: {currentAssignment.status}</div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={handleRemoveAssignment}
              >
                Remover Atribuição
              </Button>
            </div>
          )}

          <div>
            <Label htmlFor="user">Usuário</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {users?.map((user: any) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.nome} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Data Limite</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "dd/MM/yyyy") : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="instructions">Instruções</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Instruções específicas para o responsável..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAssigning}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={!selectedUser || !dueDate || isAssigning}
            >
              {isAssigning ? 'Atribuindo...' : currentAssignment ? 'Atualizar' : 'Atribuir'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};