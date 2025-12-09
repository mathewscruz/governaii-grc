import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { Upload, Building2, Bell, Mail, Save, Loader2 } from 'lucide-react';
import { EmailTestDialog } from './EmailTestDialog';

interface Props {
  userRole: string;
}

interface NotificationPreferences {
  email_notifications: boolean;
  in_app_notifications: boolean;
  digest_frequency: 'realtime' | 'daily' | 'weekly';
}

const ConfiguracoesGerais = ({ userRole }: Props) => {
  const { user, company, refetchProfile, forceLogoUpdate } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [emailTestDialogOpen, setEmailTestDialogOpen] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    in_app_notifications: true,
    digest_frequency: 'realtime',
  });

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        if (data) {
          setUserProfile(data);
          // Load notification preferences from localStorage
          const savedPrefs = localStorage.getItem(`notification_prefs_${user.id}`);
          if (savedPrefs) {
            try {
              setNotificationPreferences(JSON.parse(savedPrefs));
            } catch (e) {
              console.error('Error parsing notification preferences:', e);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        toast.error('Erro ao carregar perfil');
      }
    };

    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    setLogoPreview(null);
  }, [company?.logo_url]);

  const validateImageFile = (file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return 'Formato de arquivo não suportado. Use: JPG, PNG, GIF, SVG ou WebP';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return 'Arquivo muito grande. Tamanho máximo: 5MB';
    }
    
    return null;
  };

  const verifyImageLoad = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  const handleCompanyLogoUpload = async (file: File) => {
    if (!userProfile?.empresa_id) {
      toast.error('Empresa não encontrada');
      return;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setUploading(true);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `empresa-${userProfile.empresa_id}-${timestamp}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('empresa-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('empresa-logos')
        .getPublicUrl(filePath);

      const logoUrlWithCacheBusting = `${urlData.publicUrl}?t=${timestamp}`;

      const isImageReady = await verifyImageLoad(logoUrlWithCacheBusting);
      if (!isImageReady) {
        throw new Error('Falha ao verificar se a imagem foi carregada corretamente');
      }

      const { error: updateError } = await supabase
        .from('empresas')
        .update({ logo_url: logoUrlWithCacheBusting })
        .eq('id', userProfile.empresa_id)
        .select();

      if (updateError) {
        throw new Error(`Erro ao atualizar banco: ${updateError.message}`);
      }

      await refetchProfile();
      forceLogoUpdate();

      toast.success('Logo da empresa atualizado com sucesso');

    } catch (error: any) {
      console.error('Erro no upload do logo:', error);
      
      let errorMessage = 'Erro ao fazer upload do logo da empresa';
      if (error.message.includes('upload')) {
        errorMessage = 'Erro ao enviar arquivo para o servidor';
      } else if (error.message.includes('banco')) {
        errorMessage = 'Erro ao salvar informações no banco de dados';
      } else if (error.message.includes('not allowed') || error.message.includes('policy')) {
        errorMessage = 'Você não tem permissão para atualizar o logo da empresa';
      }
      
      toast.error(errorMessage);
      setLogoPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const saveNotificationPreferences = async () => {
    setSavingPreferences(true);
    try {
      // Save to localStorage (DB column doesn't exist yet)
      localStorage.setItem(`notification_prefs_${user?.id}`, JSON.stringify(notificationPreferences));
      toast.success('Preferências salvas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar preferências:', error);
      toast.error(error.message || 'Erro ao salvar preferências');
    } finally {
      setSavingPreferences(false);
    }
  };

  const getCurrentCompanyLogo = () => {
    if (logoPreview) return logoPreview;
    if (company?.logo_url) {
      const hasTimestamp = company.logo_url.includes('?t=');
      return hasTimestamp ? company.logo_url : `${company.logo_url}?t=${Date.now()}`;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Company Logo Section */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Identidade Visual
            </CardTitle>
            <CardDescription>
              Configure o logo da empresa que será exibido no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                {getCurrentCompanyLogo() ? (
                  <div className="relative">
                    <img
                      key={`company-logo-${Date.now()}`}
                      src={getCurrentCompanyLogo()!}
                      alt="Logo da empresa"
                      className={`h-20 w-auto max-w-[140px] object-contain border-2 border-border rounded-lg bg-background ${
                        uploading ? 'opacity-50' : ''
                      }`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-lg border-2 border-dashed border-border bg-muted flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Logo da Empresa</Label>
                <p className="text-sm text-muted-foreground">
                  Será exibido no menu lateral e tela de login
                </p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(',')}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCompanyLogoUpload(file);
                    }}
                    disabled={uploading}
                  />
                  <Button variant="outline" disabled={uploading} asChild>
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      {uploading ? 'Enviando...' : 'Alterar Logo'}
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: JPG, PNG, GIF, SVG, WebP (máx. 5MB)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Preferências de Notificação
          </CardTitle>
          <CardDescription>
            Configure como você deseja receber notificações do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Notificações por Email</Label>
              <p className="text-sm text-muted-foreground">
                Receba alertas e notificações importantes por email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={notificationPreferences.email_notifications}
              onCheckedChange={(checked) => 
                setNotificationPreferences(prev => ({ ...prev, email_notifications: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="in-app-notifications">Notificações In-App</Label>
              <p className="text-sm text-muted-foreground">
                Receba notificações dentro do sistema (ícone de sino)
              </p>
            </div>
            <Switch
              id="in-app-notifications"
              checked={notificationPreferences.in_app_notifications}
              onCheckedChange={(checked) => 
                setNotificationPreferences(prev => ({ ...prev, in_app_notifications: checked }))
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Frequência do Digest</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Com que frequência você deseja receber resumos por email
            </p>
            <div className="flex gap-2">
              {[
                { value: 'realtime', label: 'Tempo Real' },
                { value: 'daily', label: 'Diário' },
                { value: 'weekly', label: 'Semanal' },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={notificationPreferences.digest_frequency === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => 
                    setNotificationPreferences(prev => ({ 
                      ...prev, 
                      digest_frequency: option.value as NotificationPreferences['digest_frequency']
                    }))
                  }
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={saveNotificationPreferences} disabled={savingPreferences}>
              {savingPreferences ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Preferências
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Test Section - Admin Only */}
      {isAdmin && (
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
      )}

      <EmailTestDialog 
        open={emailTestDialogOpen} 
        onOpenChange={setEmailTestDialogOpen} 
      />
    </div>
  );
};

export default ConfiguracoesGerais;
