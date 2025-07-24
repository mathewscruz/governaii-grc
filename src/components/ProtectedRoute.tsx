import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  moduleName: string;
  action?: 'access' | 'create' | 'read' | 'update' | 'delete';
  fallbackToRoleCheck?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  moduleName,
  action = 'access',
  fallbackToRoleCheck = true,
}) => {
  const { profile } = useAuth();
  const { canAccess, canCreate, canRead, canUpdate, canDelete, loading } = usePermissions();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Verificar permissões baseadas no novo sistema
  const hasPermission = () => {
    switch (action) {
      case 'access':
        return canAccess(moduleName);
      case 'create':
        return canCreate(moduleName);
      case 'read':
        return canRead(moduleName);
      case 'update':
        return canUpdate(moduleName);
      case 'delete':
        return canDelete(moduleName);
      default:
        return false;
    }
  };

  // Fallback para sistema de roles atual (retrocompatibilidade)
  const hasRoleAccess = () => {
    if (!profile || !fallbackToRoleCheck) return false;
    
    const { role } = profile;
    
    switch (role) {
      case 'super_admin':
        return true;
      case 'admin':
        return moduleName !== 'configuracoes' || action !== 'delete';
      case 'user':
        return moduleName !== 'configuracoes' && 
               !(moduleName === 'auditorias' && ['create', 'update', 'delete'].includes(action));
      case 'readonly':
        return action === 'read' && moduleName !== 'configuracoes';
      default:
        return false;
    }
  };

  const allowed = hasPermission() || hasRoleAccess();

  if (!allowed) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <Lock className="h-8 w-8 text-destructive" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Acesso Negado</h3>
                <p className="text-sm text-muted-foreground">
                  Você não tem permissão para acessar este módulo ou realizar esta ação.
                </p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Entre em contato com o administrador para solicitar acesso.
                </p>
              </div>

              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Voltar ao Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};