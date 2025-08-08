import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Send, FileText, Download, Save, Loader2 } from 'lucide-react';
import DocLayoutBuilder from './DocLayoutBuilder';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DocGenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentSaved?: () => void;
}

interface TooltipTerm {
  term: string;
  definition: string;
}

const TOOLTIPS: Record<string, string> = {
  'BIA': 'Business Impact Analysis - Análise de Impacto no Negócio. Processo que identifica e avalia os efeitos potenciais de interrupções nas operações críticas da organização.',
  'ROPA': 'Record of Processing Activities - Registro das Atividades de Tratamento. Documento que lista todos os tratamentos de dados pessoais realizados pela organização.',
  'RTO': 'Recovery Time Objective - Tempo máximo aceitável para restaurar um sistema após uma interrupção.',
  'ISO': 'International Organization for Standardization - Organização internacional que desenvolve padrões técnicos.',
  'LGPD': 'Lei Geral de Proteção de Dados - Lei brasileira que regula o tratamento de dados pessoais.',
  'SLA': 'Service Level Agreement - Acordo de Nível de Serviço que define padrões de qualidade esperados.',
  'KPI': 'Key Performance Indicator - Indicador-chave de performance usado para medir eficiência.',
  'PDCA': 'Plan-Do-Check-Act - Metodologia de melhoria contínua em quatro etapas.'
};

export const DocGenDialog: React.FC<DocGenDialogProps> = ({
  open,
  onOpenChange,
  onDocumentSaved
}) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [documentReady, setDocumentReady] = useState(false);
  const [currentDocType, setCurrentDocType] = useState<string | null>(null);
  const [generatedDocument, setGeneratedDocument] = useState<any>(null);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Buscar informações do usuário
  const [userInfo, setUserInfo] = useState<{ user_id: string; empresa_id: string; nome: string } | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nome, empresa_id')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setUserInfo({
            user_id: user.id,
            empresa_id: profile.empresa_id,
            nome: profile.nome
          });
        }
      }
    };

    if (open) {
      fetchUserInfo();
      // Iniciar conversa com saudação
      setMessages([{
        role: 'assistant',
        content: 'Olá! Sou o DocGen, seu assistente inteligente para criação de documentos. Estou aqui para ajudá-lo a criar qualquer tipo de documento que você precisa.\n\nPode me contar que tipo de documento você gostaria de criar?',
        timestamp: new Date()
      }]);
    }
  }, [open]);

  // Auto scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !userInfo || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('docgen-chat', {
        body: {
          message: inputMessage,
          conversation_id: conversationId,
          user_id: userInfo.user_id,
          empresa_id: userInfo.empresa_id,
          action: 'chat'
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConversationId(data.conversation_id);
      setCurrentDocType(data.tipo_documento_identificado);
      setDocumentReady(data.documento_pronto);

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateDocument = async () => {
    if (!userInfo || !conversationId || isGeneratingDoc) return;

    setIsGeneratingDoc(true);

    try {
      const { data, error } = await supabase.functions.invoke('docgen-chat', {
        body: {
          conversation_id: conversationId,
          user_id: userInfo.user_id,
          empresa_id: userInfo.empresa_id,
          action: 'generate_document'
        }
      });

      if (error) throw error;

      setGeneratedDocument(data.document);
      toast({
        title: "Documento Gerado!",
        description: "Seu documento foi criado com sucesso. Agora você pode salvá-lo no sistema ou exportar.",
      });

    } catch (error) {
      console.error('Erro ao gerar documento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o documento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  const saveDocument = async () => {
    if (!generatedDocument || !userInfo) return;

    try {
      const { error } = await supabase
        .from('documentos')
        .insert({
          nome: generatedDocument.titulo,
          tipo: currentDocType || 'outros',
          conteudo: generatedDocument,
          status: 'rascunho',
          versao: generatedDocument.versao,
          empresa_id: userInfo.empresa_id,
          created_by: userInfo.user_id,
          data_criacao: new Date().toISOString(),
          classificacao: generatedDocument.metadados?.classificacao || 'interno'
        });

      if (error) throw error;

      toast({
        title: "Documento Salvo!",
        description: "O documento foi salvo no sistema com sucesso.",
      });

      onDocumentSaved?.();
      onOpenChange(false);

    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o documento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const exportDocument = () => {
    if (!generatedDocument) return;

    // Criar conteúdo em texto para export
    let content = `${generatedDocument.titulo}\n`;
    content += `Versão: ${generatedDocument.versao}\n`;
    content += `Data: ${generatedDocument.data_criacao}\n\n`;

    generatedDocument.secoes?.forEach((secao: any) => {
      content += `${secao.nome}\n`;
      content += `${secao.conteudo}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedDocument.titulo}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Documento Exportado!",
      description: "O documento foi exportado como arquivo de texto.",
    });
  };

  const formatMessage = (content: string) => {
    // Processar markdown básico
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **texto** -> bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // *texto* -> italic
      .replace(/\n/g, '<br />'); // quebras de linha

    // Processar listas numeradas
    formatted = formatted.replace(/(\d+\.\s.*?)(<br \/>|$)/g, '<div class="ml-4 mb-1">$1</div>');
    
    return { __html: formatted };
  };

  const renderMessageWithTooltips = (content: string) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    Object.entries(TOOLTIPS).forEach(([term, definition]) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
          parts.push(content.slice(lastIndex, match.index));
        }
        
        // Add the tooltip term
        parts.push(
          <TooltipProvider key={`${term}-${match.index}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="underline decoration-dotted text-primary cursor-help">
                  {match[0]}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{definition}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
        
        lastIndex = match.index + match[0].length;
      }
    });
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }
    
    return parts.length > 0 ? parts : [content];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            DocGen 🧠 - Gerador Inteligente de Documentos
            {currentDocType && (
              <Badge variant="secondary" className="ml-2">
                {currentDocType}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 pr-4 min-h-0">
              <div className="space-y-4 p-1 min-h-[300px]">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <Card className={`max-w-[85%] ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <CardContent className="p-3">
                        <div className="text-sm leading-relaxed">
                          {message.role === 'assistant' ? (
                            <div 
                              dangerouslySetInnerHTML={formatMessage(message.content)}
                              className="prose prose-sm max-w-none [&>div]:leading-relaxed"
                            />
                          ) : (
                            message.content
                          )}
                        </div>
                        <div className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <Card className="bg-muted">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">DocGen está pensando...</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="mt-4 flex gap-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem aqui..."
                className="flex-1 min-h-[60px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="icon"
                className="h-[60px]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Action Buttons */}
            {documentReady && !generatedDocument && (
              <div className="mt-4 flex justify-center">
                <Button
                  onClick={generateDocument}
                  disabled={isGeneratingDoc}
                  className="gap-2"
                >
                  {isGeneratingDoc ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {isGeneratingDoc ? 'Gerando Documento...' : 'Gerar Documento'}
                </Button>
              </div>
            )}
          </div>

          {/* Document Preview */}
          {generatedDocument && (
            <div className="w-1/2 border-l pl-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{isEditingLayout ? 'Editor de Layout' : 'Preview do Documento'}</h3>
                <div className="flex gap-2">
                  <Button onClick={() => setIsEditingLayout(!isEditingLayout)} size="sm" variant="outline" className="gap-1">
                    {isEditingLayout ? 'Concluir Layout' : 'Editar Layout'}
                  </Button>
                  <Button onClick={saveDocument} size="sm" className="gap-1">
                    <Save className="h-3 w-3" />
                    Salvar no Sistema
                  </Button>
                  <Button onClick={exportDocument} size="sm" variant="outline" className="gap-1">
                    <Download className="h-3 w-3" />
                    Exportar
                  </Button>
                </div>
              </div>
              
              {isEditingLayout ? (
                <div className="h-full">
                  <DocLayoutBuilder value={generatedDocument} onChange={setGeneratedDocument} />
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-bold text-lg">{generatedDocument.titulo}</h4>
                      <p className="text-muted-foreground">
                        Versão: {generatedDocument.versao} | {generatedDocument.data_criacao}
                      </p>
                    </div>
                    {generatedDocument.secoes?.map((secao: any, index: number) => (
                      <div key={index}>
                        <h5 className="font-semibold mb-2">{secao.nome}</h5>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {secao.conteudo}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};