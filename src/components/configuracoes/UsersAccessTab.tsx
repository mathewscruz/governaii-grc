import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, Bell } from 'lucide-react';
import GerenciamentoUsuariosEnhanced from './GerenciamentoUsuariosEnhanced';
import { PermissionMatrix } from './PermissionMatrix';
import { ReminderSettings } from './ReminderSettings';

interface UsersAccessTabProps {
  userRole: string;
  isAdmin: boolean;
  selectedUserId?: string;
}

export function UsersAccessTab({ userRole, isAdmin, selectedUserId }: UsersAccessTabProps) {
  const defaultSubTab = selectedUserId ? 'permissoes' : 'usuarios';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Usuários & Acessos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultSubTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="usuarios" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="permissoes" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Permissões
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="lembretes" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Lembretes
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="usuarios">
            <GerenciamentoUsuariosEnhanced userRole={userRole} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="permissoes">
              <PermissionMatrix selectedUserId={selectedUserId} />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="lembretes">
              <ReminderSettings />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}