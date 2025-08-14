import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Smartphone, Laptop, Download, Shield, CheckCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { AgentInstallInstructions } from "./AgentInstallInstructions";

interface AgentInstallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentInstallDialog({ open, onOpenChange }: AgentInstallDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const platforms = [
    {
      name: "Windows",
      description: "Arquivo executável .bat para instalação transparente",
      icon: <Monitor className="w-8 h-8" />,
      extension: ".bat",
      requirements: "Windows 10+, Permissões de Admin",
      status: "Executável Direto",
      features: ["Duplo-clique para instalar", "Ícone System Tray", "Auto-start com Windows", "Menu de contexto completo"]
    },
    {
      name: "Linux",
      description: "Pacote DEB nativo para distribuições Debian/Ubuntu",
      icon: <Laptop className="w-8 h-8" />,
      extension: ".deb",
      requirements: "dpkg, systemd, sudo",
      status: "Pacote Nativo",
      features: ["Instalação via dpkg", "Serviço systemd", "Integração completa", "Remoção limpa"]
    },
    {
      name: "macOS",
      description: "Pacote PKG nativo do macOS com assistente visual",
      icon: <Smartphone className="w-8 h-8" />,
      extension: ".pkg",
      requirements: "macOS 10.15+, pkgbuild",
      status: "Pacote Nativo",
      features: ["Instalador visual", "LaunchAgent", "Integração nativa", "Desinstalação completa"]
    }
  ];

  const downloadAgent = async (platform: string) => {
    try {
      setIsDownloading(true);

      const { data, error } = await supabase.functions.invoke('generate-agent-installer', {
        body: { platform }
      });

      if (error) {
        throw error;
      }

      // Criar blob e baixar arquivo
      const blob = new Blob([data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getFilename(platform);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSelectedPlatform(platform);
      toast.success(`Instalador ${platform} gerado com sucesso!`, {
        description: "Verifique as instruções de instalação abaixo."
      });
    } catch (error) {
      console.error('Erro ao baixar agente:', error);
      toast.error('Erro ao gerar instalador. Tente novamente.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getFilename = (platform: string) => {
    const timestamp = Date.now();
    switch (platform) {
      case 'windows': return `GovernAII-Agent-Setup-${timestamp}.bat`;
      case 'linux': return `governaii-agent_1.0.0_amd64-${timestamp}.deb`;
      case 'macos': return `GovernAII-Agent-1.0.0-${timestamp}.pkg`;
      default: return `governaii-agent-${timestamp}.bin`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Instaladores Profissionais do Agente GovernAII
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações sobre o agente */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border border-primary/20">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2 text-lg">
                  Agente de Descoberta de Ativos GovernAII
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Solução profissional para descoberta automática de ativos de TI. O agente executa como serviço 
                  do sistema, coletando informações de hardware, software e configurações de rede de forma segura 
                  e criptografada. Ideal para compliance, gestão de ativos e auditoria contínua.
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Criptografia TLS
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Conformidade LGPD
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Instalação Automática
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Cards das plataformas aprimorados */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {platforms.map((platform) => (
              <Card key={platform.name} className="relative hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/30">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      {platform.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{platform.name}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {platform.description}
                  </CardDescription>
                  <Badge variant="outline" className="text-xs mt-2 bg-green-50 text-green-700 border-green-200">
                    {platform.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <Badge variant="secondary" className="text-xs font-mono">
                      {platform.extension}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      <strong>Requisitos:</strong> {platform.requirements}
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Funcionalidades:</p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {platform.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={() => downloadAgent(platform.name.toLowerCase())}
                    disabled={isDownloading}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isDownloading ? 'Gerando...' : 'Gerar Instalador'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Instruções detalhadas */}
          {selectedPlatform && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">Instruções de Instalação - {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}</h3>
              </div>
              <AgentInstallInstructions platform={selectedPlatform} />
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}