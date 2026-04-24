import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle, Eye, EyeOff, Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { logger } from '@/lib/logger';
import { useLanguage } from '@/contexts/LanguageContext';

interface PasswordChangeRequiredProps {
  open: boolean;
  onPasswordChanged: () => void;
}

// Função para calcular força da senha
const calculatePasswordStrength = (password: string, t: (k: string) => string): { score: number; label: string; color: string } => {
  let score = 0;
  
  if (password.length >= 6) score += 20;
  if (password.length >= 8) score += 20;
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;

  if (score <= 20) return { score, label: t('passwordChange.strengthVeryWeak'), color: 'bg-red-500' };
  if (score <= 40) return { score, label: t('passwordChange.strengthWeak'), color: 'bg-orange-500' };
  if (score <= 60) return { score, label: t('passwordChange.strengthFair'), color: 'bg-yellow-500' };
  if (score <= 80) return { score, label: t('passwordChange.strengthGood'), color: 'bg-blue-500' };
  return { score, label: t('passwordChange.strengthStrong'), color: 'bg-green-500' };
};

const PasswordChangeRequired: React.FC<PasswordChangeRequiredProps> = ({ open, onPasswordChanged }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cálculo de força da senha
  const passwordStrength = useMemo(() => calculatePasswordStrength(newPassword), [newPassword]);

  // Requisitos da senha
  const requirements = useMemo(() => ({
    minLength: newPassword.length >= 6,
    differentFromCurrent: newPassword !== currentPassword && currentPassword.length > 0,
    passwordsMatch: newPassword === confirmPassword && confirmPassword.length > 0,
  }), [newPassword, confirmPassword, currentPassword]);

  const allRequirementsMet = requirements.minLength && requirements.differentFromCurrent && requirements.passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword === currentPassword) {
      toast.error('A nova senha deve ser diferente da senha atual');
      return;
    }

    try {
      setLoading(true);

      // Validar senha atual via re-autenticação
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser?.email) throw new Error('Não foi possível obter o email do usuário');

      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPassword,
      });

      if (reAuthError) {
        toast.error('Senha atual incorreta. Verifique e tente novamente.');
        return;
      }

      // Atualizar senha no Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Atualizar status da senha temporária
      const user = await supabase.auth.getUser();
      if (user.data.user) {
        await supabase
          .from('temporary_passwords')
          .update({ is_temporary: false })
          .eq('user_id', user.data.user.id);
      }

      toast.success('Senha alterada com sucesso!');
      onPasswordChanged();
    } catch (error: any) {
      logger.error('Erro ao alterar senha', { module: 'Auth', action: 'change-password' });
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-xl">Alteração de Senha Obrigatória</DialogTitle>
          <DialogDescription>
            Por segurança, você deve alterar sua senha temporária antes de continuar.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Esta é a primeira vez que você acessa o sistema. Por favor, defina uma nova senha segura.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual (Temporária)</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha temporária"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              
              {/* Indicador de força da senha */}
              {newPassword.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Progress value={passwordStrength.score} className="h-2 flex-1" />
                    <span className={`text-xs font-medium ${
                      passwordStrength.score <= 40 ? 'text-red-600' :
                      passwordStrength.score <= 60 ? 'text-yellow-600' :
                      passwordStrength.score <= 80 ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua nova senha"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Lista de requisitos */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Requisitos da senha:</p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2 text-sm">
                  {requirements.minLength ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={requirements.minLength ? 'text-green-700' : 'text-muted-foreground'}>
                    Mínimo 6 caracteres
                  </span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  {requirements.differentFromCurrent ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={requirements.differentFromCurrent ? 'text-green-700' : 'text-muted-foreground'}>
                    Diferente da senha atual
                  </span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  {requirements.passwordsMatch ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={requirements.passwordsMatch ? 'text-green-700' : 'text-muted-foreground'}>
                    Senhas coincidem
                  </span>
                </li>
              </ul>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !allRequirementsMet}
            >
              {loading ? 'Alterando senha...' : 'Alterar Senha'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordChangeRequired;
