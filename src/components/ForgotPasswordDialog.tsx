import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const emailSchema = z.string().min(1, 'Email é obrigatório').email('Email inválido');

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    
    // Validação com Zod
    const validation = emailSchema.safeParse(email.trim());
    if (!validation.success) {
      setEmailError(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      logger.info('Iniciando processo de recuperação de senha', { email: email.trim(), module: 'Auth', action: 'password-reset' });
      
      // Enviar diretamente para a edge function com o email
      // A edge function faz a busca com SERVICE_ROLE_KEY (sem restrições de RLS)
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email: email.trim() }
      });

      if (error) {
        logger.error('Erro ao invocar send-password-reset', { 
          email: email.trim(), 
          error: error.message,
          errorDetails: JSON.stringify(error),
          module: 'Auth', 
          action: 'password-reset' 
        });
        console.error('Detalhes do erro send-password-reset:', error);
      } else {
        logger.info('Reset de senha processado', { 
          email: email.trim(),
          response: JSON.stringify(data),
          module: 'Auth', 
          action: 'password-reset' 
        });
      }

      // SEMPRE mostrar mensagem de sucesso (proteção contra enumeração de emails)
      toast.success('Se o e-mail estiver cadastrado, você receberá as instruções de recuperação. Verifique também a pasta de spam/lixo eletrônico.', { duration: 8000 });
      setEmail('');
      onOpenChange(false);
    } catch (error: any) {
      logger.error('Erro no processo de recuperação de senha', { 
        error: error.message,
        stack: error.stack,
        module: 'Auth', 
        action: 'password-reset' 
      });
      console.error('Erro completo no processo de recuperação:', error);
      // Mesmo em caso de erro, mostrar mensagem genérica
      toast.success('Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.');
      setEmail('');
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Recuperar Senha
          </DialogTitle>
          <DialogDescription>
            Digite seu e-mail para receber instruções de recuperação de senha.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-email">E-mail</Label>
            <Input
              id="forgot-email"
              type="email"
              placeholder="seu.email@empresa.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              autoFocus
              className={emailError ? 'border-destructive' : ''}
            />
            {emailError && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
