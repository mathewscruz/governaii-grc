import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { CompanyContextSettings } from './CompanyContextSettings';
import { CompanyLogoUpload } from './CompanyLogoUpload';
import { EmailTestDialog } from './EmailTestDialog';

export function OrganizacaoTab() {
  const [emailTestDialogOpen, setEmailTestDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <CompanyContextSettings />

      <CompanyLogoUpload />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configuração de Email
          </CardTitle>
          <CardDescription>
            Teste se o sistema está enviando emails corretamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-medium">Testar Envio de Email</p>
              <p className="text-sm text-muted-foreground">
                Envia um email de teste para verificar a configuração
              </p>
            </div>
            <Button variant="outline" onClick={() => setEmailTestDialogOpen(true)}>
              <Mail className="h-4 w-4 mr-2" />
              Enviar Email de Teste
            </Button>
          </div>
        </CardContent>
      </Card>

      <EmailTestDialog
        open={emailTestDialogOpen}
        onOpenChange={setEmailTestDialogOpen}
      />
    </div>
  );
}