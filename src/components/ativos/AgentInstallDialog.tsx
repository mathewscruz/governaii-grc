import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Smartphone, Laptop, Download, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AgentInstallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentInstallDialog({ open, onOpenChange }: AgentInstallDialogProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const { toast } = useToast();

  const platforms = [
    {
      id: 'windows',
      name: 'Windows',
      description: 'Windows 10/11 (PowerShell)',
      icon: Monitor,
      fileExtension: '.ps1',
      requirements: 'PowerShell 5.0 ou superior'
    },
    {
      id: 'linux',
      name: 'Linux',
      description: 'Ubuntu, Debian, CentOS, RHEL',
      icon: Laptop,
      fileExtension: '.sh',
      requirements: 'Python 3.6+ e systemd'
    },
    {
      id: 'macos',
      name: 'macOS',
      description: 'macOS 10.14 ou superior',
      icon: Smartphone,
      fileExtension: '.sh',
      requirements: 'Python 3.6+ pré-instalado'
    }
  ];

  const downloadAgent = async (platform: string) => {
    try {
      setDownloading(platform);

      const { data, error } = await supabase.functions.invoke('generate-agent-installer', {
        body: { platform },
      });

      if (error) throw error;

      // Criar blob e fazer download
      const blob = new Blob([data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const platformConfig = platforms.find(p => p.id === platform);
      a.download = `governaii-agent-${platform}${platformConfig?.fileExtension}`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Iniciado",
        description: `O instalador do agente para ${platformConfig?.name} foi baixado com sucesso.`,
      });

    } catch (error) {
      console.error('Error downloading agent:', error);
      toast({
        title: "Erro no Download",
        description: "Não foi possível baixar o instalador do agente. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Instalar Agente de Descoberta de Ativos</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">Como funciona o Agente</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  O agente é um programa leve que roda em segundo plano e automaticamente descobre e reporta 
                  informações sobre hardware e software instalados na máquina para o GovernAII.
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                  <li>• Descobre automaticamente ativos de hardware e software</li>
                  <li>• Monitora status online/offline em tempo real</li>
                  <li>• Atualiza informações diariamente</li>
                  <li>• Comunicação segura e criptografada</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              const isDownloading = downloading === platform.id;

              return (
                <Card key={platform.id} className="relative">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-2">
                      <Icon className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{platform.name}</CardTitle>
                    <CardDescription>{platform.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="text-center space-y-4">
                    <div>
                      <Badge variant="secondary" className="text-xs">
                        {platform.fileExtension}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      <strong>Requisitos:</strong><br />
                      {platform.requirements}
                    </div>

                    <Button
                      onClick={() => downloadAgent(platform.id)}
                      disabled={isDownloading}
                      className="w-full"
                    >
                      {isDownloading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Baixando...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Baixar Agente
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
              Instruções de Instalação
            </h4>
            <div className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
              <p><strong>Windows:</strong> Execute o arquivo .ps1 como Administrador no PowerShell</p>
              <p><strong>Linux:</strong> Execute o arquivo .sh com sudo (sudo bash governaii-agent-linux.sh)</p>
              <p><strong>macOS:</strong> Execute o arquivo .sh no Terminal (bash governaii-agent-macos.sh)</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}