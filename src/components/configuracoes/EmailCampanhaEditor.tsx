import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Sparkles, Send, Save, ImageIcon, Upload, X, Eye, MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { EmailPreview } from './EmailPreview';

export interface CampanhaRow {
  id: string;
  assunto: string;
  conteudo_html: string;
  imagem_url: string | null;
  status: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campanha?: CampanhaRow | null;
  onSaved: () => void;
}

export function EmailCampanhaEditor({ open, onOpenChange, campanha, onSaved }: Props) {
  const { profile } = useAuth();
  const [id, setId] = useState<string | null>(null);
  const [assunto, setAssunto] = useState('');
  const [conteudoHtml, setConteudoHtml] = useState('');
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiIncludeImage, setAiIncludeImage] = useState(true);
  const [aiIncludeSubject, setAiIncludeSubject] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [activeUserCount, setActiveUserCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    if (open) {
      setId(campanha?.id ?? null);
      setAssunto(campanha?.assunto ?? '');
      setConteudoHtml(campanha?.conteudo_html ?? '');
      setImagemUrl(campanha?.imagem_url ?? null);
      setAiPrompt('');
      setAiIncludeImage(true);
      setAiIncludeSubject(true);
    }
  }, [open, campanha]);

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Descreva o que a IA deve criar');
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-email-content', {
        body: { prompt: aiPrompt, includeImage: aiIncludeImage, includeSubject: aiIncludeSubject },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setConteudoHtml((data as any).html || '');
      if ((data as any).imageUrl) setImagemUrl((data as any).imageUrl);
      if (aiIncludeSubject && (data as any).subject) setAssunto((data as any).subject);
      toast.success('Conteúdo gerado pela IA');
    } catch (err: any) {
      logger.error('Erro ao gerar conteúdo', err);
      const msg = err?.message?.includes('402') || err?.context?.status === 402
        ? 'Créditos da IA esgotados. Adicione créditos no workspace.'
        : err?.message || 'Não foi possível gerar o conteúdo';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `manual/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('email-assets').upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from('email-assets').getPublicUrl(path);
      setImagemUrl(data.publicUrl);
      toast.success('Imagem enviada');
    } catch (err: any) {
      logger.error('Erro ao subir imagem', err);
      toast.error('Não foi possível enviar a imagem');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const validate = () => {
    if (!assunto.trim()) {
      toast.error('Informe o assunto');
      return false;
    }
    if (!conteudoHtml.trim()) {
      toast.error('Conteúdo do e-mail está vazio');
      return false;
    }
    return true;
  };

  const persist = async (status: 'rascunho') => {
    if (!profile?.user_id) return null;
    if (!validate()) return null;
    setSaving(true);
    try {
      const payload = {
        assunto: assunto.trim().replace(/^\s*\[\s*teste\s*\]\s*/i, '').trim(),
        conteudo_html: conteudoHtml,
        imagem_url: imagemUrl,
        status,
        criado_por: profile.user_id,
      };
      if (id) {
        const { error } = await supabase.from('email_campanhas').update(payload).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase
        .from('email_campanhas')
        .insert(payload)
        .select('id')
        .single();
      if (error) throw error;
      setId(data.id);
      return data.id as string;
    } catch (err: any) {
      logger.error('Erro ao salvar campanha', err);
      toast.error('Não foi possível salvar a campanha');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    const savedId = await persist('rascunho');
    if (savedId) {
      toast.success('Rascunho salvo');
      onSaved();
    }
  };

  const openConfirmSend = async () => {
    if (!validate()) return;
    // Salvar antes de abrir confirmação
    const savedId = await persist('rascunho');
    if (!savedId) return;
    // Buscar destinatários ativos
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true)
      .not('email', 'is', null);
    if (error) {
      logger.error('Erro contar destinatários', error);
      toast.error('Erro ao contar destinatários');
      return;
    }
    setActiveUserCount(count ?? 0);
    setConfirmSend(true);
  };

  const handleConfirmSend = async () => {
    if (!id) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email-campaign', {
        body: { campanha_id: id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const { sent, failed } = (data as any) || {};
      toast.success(`Campanha enviada: ${sent ?? 0} entregues, ${failed ?? 0} falhas`);
      setConfirmSend(false);
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      logger.error('Erro ao enviar campanha', err);
      toast.error(err?.message || 'Falha ao enviar');
    } finally {
      setSending(false);
    }
  };

  const handleSendTest = async () => {
    if (!validate()) return;
    const savedId = await persist('rascunho');
    if (!savedId) return;
    setSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email-campaign', {
        body: { campanha_id: savedId, mode: 'test' },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const { sent, failed } = (data as any) || {};
      if (sent > 0) {
        toast.success(`Teste enviado para ${profile?.email ?? 'seu e-mail'}`);
      } else {
        toast.error(`Falha ao enviar teste${failed ? ` (${failed} erro)` : ''}`);
      }
      onSaved();
    } catch (err: any) {
      logger.error('Erro ao enviar teste', err);
      toast.error(err?.message || 'Falha ao enviar teste');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>{id ? 'Editar campanha' : 'Nova campanha de e-mail'}</DialogTitle>
            <DialogDescription>
              Crie um e-mail informativo para todos os usuários ativos. O cabeçalho e rodapé Akuris são aplicados automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Coluna esquerda — formulário */}
            <div className="space-y-5">
              <div className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Gerar com IA
                </div>
                <Textarea
                  placeholder='Ex.: "Crie um e-mail de marketing falando sobre o módulo de Gestão de Riscos, destacando os diferenciais e o que faz a Akuris ser superior aos concorrentes."'
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={3}
                />
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={aiIncludeImage} onCheckedChange={(v) => setAiIncludeImage(Boolean(v))} />
                    Gerar imagem ilustrativa
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={aiIncludeSubject} onCheckedChange={(v) => setAiIncludeSubject(Boolean(v))} />
                    Sugerir assunto
                  </label>
                  <Button onClick={handleGenerate} disabled={generating} size="sm" className="ml-auto">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Gerar
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assunto">Assunto</Label>
                <Input
                  id="assunto"
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  placeholder="Assunto do e-mail"
                  maxLength={150}
                />
              </div>

              <div className="space-y-2">
                <Label>Imagem ilustrativa (opcional)</Label>
                {imagemUrl ? (
                  <div className="relative inline-block">
                    <img src={imagemUrl} alt="Imagem do e-mail" className="max-h-40 rounded-md border border-border" />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-7 w-7"
                      onClick={() => setImagemUrl(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="upload-img"
                      className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-dashed border-border px-3 py-2 text-sm hover:bg-muted/50"
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Enviar imagem manualmente
                    </Label>
                    <Input id="upload-img" type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
                    <span className="text-xs text-muted-foreground">ou use a IA acima</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="conteudo">Conteúdo do e-mail (HTML)</Label>
                <Textarea
                  id="conteudo"
                  value={conteudoHtml}
                  onChange={(e) => setConteudoHtml(e.target.value)}
                  placeholder="<h2>Título</h2><p>Texto…</p>"
                  rows={14}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Apenas o conteúdo principal. O cabeçalho com logo Akuris e o rodapé são aplicados automaticamente.
                </p>
              </div>
            </div>

            {/* Coluna direita — preview */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Eye className="h-4 w-4 text-primary" />
                Pré-visualização
              </div>
              <EmailPreview assunto={assunto} conteudoHtml={conteudoHtml} imagemUrl={imagemUrl} />
            </div>
          </div>

          <DialogFooter className="flex-wrap gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button variant="outline" onClick={handleSaveDraft} disabled={saving || sending || sendingTest}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar rascunho
            </Button>
            <Button
              variant="secondary"
              onClick={handleSendTest}
              disabled={saving || sending || sendingTest}
              title={profile?.email ? `Enviar somente para ${profile.email}` : 'Enviar somente para você'}
            >
              {sendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
              Enviar teste para mim
            </Button>
            <Button onClick={openConfirmSend} disabled={saving || sending || sendingTest}>
              <Send className="h-4 w-4" />
              Enviar para todos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmSend} onOpenChange={setConfirmSend}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar campanha para todos os usuários?</AlertDialogTitle>
            <AlertDialogDescription>
              {activeUserCount === null
                ? 'Calculando destinatários…'
                : `Esta campanha será enviada para ${activeUserCount} usuário(s) ativo(s). Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSend} disabled={sending || !activeUserCount}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Confirmar envio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
