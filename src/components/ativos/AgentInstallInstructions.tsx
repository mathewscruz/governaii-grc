import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, CheckCircle, Download, Terminal, Settings } from "lucide-react";

interface AgentInstallInstructionsProps {
  platform: string;
}

export function AgentInstallInstructions({ platform }: AgentInstallInstructionsProps) {
  const getInstructions = () => {
    switch (platform) {
      case 'windows':
        return {
          title: "Instalação Windows - Executável Transparente",
          subtitle: "Instalação automática com ícone na barra de tarefas",
          steps: [
            {
              icon: <Download className="w-5 h-5" />,
              title: "1. Download do Script",
              description: "Baixe o arquivo PowerShell gerado (.ps1)",
              details: "Este arquivo contém todo o código necessário para instalação transparente e interface system tray."
            },
            {
              icon: <Terminal className="w-5 h-5" />,
              title: "2. Executar Instalação",
              description: "Duplo-clique no arquivo ou execute via PowerShell",
              details: "Instalação é completamente transparente - sem telas ou configurações."
            },
            {
              icon: <Settings className="w-5 h-5" />,
              title: "3. Agente Instalado",
              description: "Ícone aparece automaticamente na barra de tarefas",
              details: "O agente instala-se automaticamente e cria ícone no system tray do Windows."
            },
            {
              icon: <CheckCircle className="w-5 h-5" />,
              title: "4. Funcionamento Automático",
              description: "Inicia com Windows e sincroniza automaticamente",
              details: "Clique com botão direito no ícone para ver menu com status, logs e opções."
            }
          ]
        };
      case 'linux':
        return {
          title: "Instalação Linux - Pacote DEB",
          subtitle: "Pacote Debian nativo para instalação via dpkg",
          steps: [
            {
              icon: <Download className="w-5 h-5" />,
              title: "1. Download do Pacote",
              description: "Baixe o arquivo .deb",
              details: "governaii-agent_1.0.0_amd64.deb"
            },
            {
              icon: <Terminal className="w-5 h-5" />,
              title: "2. Instalar via dpkg",
              description: "sudo dpkg -i governaii-agent_1.0.0_amd64.deb",
              details: "O pacote será instalado automaticamente com dependências"
            },
            {
              icon: <Settings className="w-5 h-5" />,
              title: "3. Iniciar Serviço",
              description: "sudo systemctl start governaii-agent",
              details: "O serviço será configurado para iniciar automaticamente"
            },
            {
              icon: <CheckCircle className="w-5 h-5" />,
              title: "4. Verificar Status",
              description: "sudo systemctl status governaii-agent",
              details: "Confirme que o agente está executando corretamente"
            }
          ]
        };
      case 'macos':
        return {
          title: "Instalação macOS - Pacote PKG",
          subtitle: "Pacote nativo do macOS com interface de instalação",
          steps: [
            {
              icon: <Download className="w-5 h-5" />,
              title: "1. Download do Pacote",
              description: "Baixe o arquivo .pkg",
              details: "GovernAII-Agent-1.0.0.pkg"
            },
            {
              icon: <Settings className="w-5 h-5" />,
              title: "2. Executar Instalador",
              description: "Clique duplo no arquivo .pkg",
              details: "Siga as instruções do assistente de instalação nativo"
            },
            {
              icon: <Shield className="w-5 h-5" />,
              title: "3. Autorizar Execução",
              description: "Permita a execução nas configurações de segurança",
              details: "Sistema > Segurança > Permitir aplicativo baixado da internet"
            },
            {
              icon: <CheckCircle className="w-5 h-5" />,
              title: "4. Verificar LaunchAgent",
              description: "O agente será iniciado automaticamente",
              details: "Verifique em Monitor de Atividade se o processo está ativo"
            }
          ]
        };
      default:
        return null;
    }
  };

  const instructions = getInstructions();
  if (!instructions) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {instructions.title}
          </CardTitle>
          <p className="text-muted-foreground">{instructions.subtitle}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {instructions.steps.map((step, index) => (
              <div key={index} className="flex gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0 text-primary">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{step.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                  <div className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground">
                    {step.details}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="troubleshooting">Solução de Problemas</TabsTrigger>
          <TabsTrigger value="features">Funcionalidades</TabsTrigger>
        </TabsList>
        
        <TabsContent value="security" className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Sobre Avisos de Segurança:</strong> Como o instalador não possui certificado digital,
              o Windows pode exibir avisos de "software desconhecido". Isso é normal e seguro.
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Como Contornar Avisos de Segurança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">1</Badge>
                <div>
                  <p className="font-medium">Windows Defender SmartScreen</p>
                  <p className="text-sm text-muted-foreground">
                    Clique em "Mais informações" e depois "Executar mesmo assim"
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">2</Badge>
                <div>
                  <p className="font-medium">Antivírus de Terceiros</p>
                  <p className="text-sm text-muted-foreground">
                    Adicione o arquivo à lista de exceções temporariamente
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">3</Badge>
                <div>
                  <p className="font-medium">UAC (Controle de Conta de Usuário)</p>
                  <p className="text-sm text-muted-foreground">
                    Clique "Sim" quando solicitado para executar como administrador
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="troubleshooting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Problemas Comuns e Soluções</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Erro "Este aplicativo não pode ser executado":</strong>
                  O arquivo baixado é um script NSIS que precisa ser compilado primeiro.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">Problema: Instalação Falha</h4>
                  <p className="text-sm text-muted-foreground">
                    Solução: Execute o PowerShell ou Prompt de Comando como administrador
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Problema: Serviço Não Inicia</h4>
                  <p className="text-sm text-muted-foreground">
                    Solução: Verifique se o PowerShell ExecutionPolicy permite scripts
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Problema: Conectividade</h4>
                  <p className="text-sm text-muted-foreground">
                    Solução: Verifique firewall e conexão com a internet
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">O que o Agente Faz</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-primary">Descoberta de Ativos</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Informações de hardware</li>
                    <li>• Software instalado</li>
                    <li>• Configurações de rede</li>
                    <li>• Sistema operacional</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-primary">Monitoramento</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Heartbeat a cada 5 minutos</li>
                    <li>• Sincronização diária de ativos</li>
                    <li>• Logs detalhados</li>
                    <li>• Status em tempo real</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}