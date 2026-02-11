import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `https://lnlkahtugwmkznasapfd.supabase.co/functions/v1/akuria-chat`;

function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        // Bold
        let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Bullet lists
        if (/^[-•]\s/.test(processed)) {
          processed = '• ' + processed.replace(/^[-•]\s/, '');
          return <p key={i} className="pl-2" dangerouslySetInnerHTML={{ __html: processed }} />;
        }
        // Numbered lists
        if (/^\d+\.\s/.test(processed)) {
          return <p key={i} className="pl-2" dangerouslySetInnerHTML={{ __html: processed }} />;
        }
        if (processed.trim() === '') return <br key={i} />;
        return <p key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
      })}
    </div>
  );
}

export function AkurIAChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { session } = useAuth();

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Msg = { role: 'user', content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
          apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGthaHR1Z3dta3puYXNhcGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxOTk4MjcsImV4cCI6MjA2ODc3NTgyN30.DRHZ_55_8aH8fEDghoY84fl3rChFNgVyPA9UM3y-KCY',
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (resp.status === 402) {
        toast.error('Créditos de IA esgotados.');
        setIsLoading(false);
        return;
      }
      if (resp.status === 429) {
        toast.error('Muitas requisições. Aguarde um momento.');
        setIsLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) {
        toast.error('Erro ao conectar com AkurIA.');
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        const snapshot = assistantSoFar;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: snapshot } : m);
          }
          return [...prev, { role: 'assistant', content: snapshot }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      console.error('AkurIA error:', e);
      toast.error('Erro ao comunicar com AkurIA.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center border-2 border-primary-foreground/20"
          title="AkurIA - Assistente Inteligente"
        >
          <img src="/akuris-favicon.png" alt="AkurIA" className="h-8 w-8 rounded-full" />
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-primary/5">
            <img src="/akuris-favicon.png" alt="AkurIA" className="h-8 w-8 rounded-full" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-foreground">AkurIA</h3>
              <p className="text-xs text-muted-foreground">Assistente GRC Inteligente</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-3">
            <div ref={scrollRef} className="space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm space-y-2">
                  <p className="font-medium">Olá! Sou a AkurIA 👋</p>
                  <p className="text-xs">Posso ajudar com informações sobre riscos, controles, incidentes, compliance e muito mais.</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <SimpleMarkdown content={msg.content} />
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t border-border p-3">
            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte sobre GRC..."
                className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" className="h-9 w-9" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
