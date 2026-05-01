import { useState, useRef, useEffect, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { Upload, Eye, EyeOff, Bell } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

import { AkurisPulse } from '@/components/ui/AkurisPulse';
const buildPerfilSchema = (t: (k: string) => string) => z.object({
  nome: z.string().min(1, t('userProfilePopover.nameRequired')),
  senha_atual: z.string().optional(),
  nova_senha: z.string().optional(),
  confirmar_senha: z.string().optional(),
}).refine((data) => {
  if (data.nova_senha || data.confirmar_senha) {
    return data.senha_atual && data.nova_senha === data.confirmar_senha;
  }
  return true;
}, {
  message: t('userProfilePopover.passwordsAndCurrent'),
  path: ["confirmar_senha"],
}).refine((data) => {
  if (data.nova_senha && data.nova_senha.length > 0 && data.nova_senha.length < 6) {
    return false;
  }
  return true;
}, {
  message: t('userProfilePopover.newPasswordMin'),
  path: ["nova_senha"],
});

type PerfilForm = {
  nome: string;
  senha_atual?: string;
  nova_senha?: string;
  confirmar_senha?: string;
};

interface UserProfilePopoverProps {
  onClose?: () => void;
}

export function UserProfilePopover({ onClose }: UserProfilePopoverProps) {
  const { t } = useLanguage();
  const perfilSchema = useMemo(() => buildPerfilSchema(t), [t]);
  const { user, profile, refetchProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [fotoUrl, setFotoUrl] = useState((profile as any)?.foto_url);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPasswords, setShowPasswords] = useState({
    atual: false,
    nova: false,
    confirmar: false,
  });
  const [notificationPrefs, setNotificationPrefs] = useState({
    email_notifications: true,
    in_app_notifications: true,
    digest_frequency: 'realtime' as 'realtime' | 'daily' | 'weekly',
  });

  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`notification_prefs_${user.id}`);
      if (saved) {
        try { setNotificationPrefs(JSON.parse(saved)); } catch {}
      }
    }
  }, [user?.id]);

  const saveNotificationPrefs = (prefs: typeof notificationPrefs) => {
    setNotificationPrefs(prefs);
    if (user?.id) {
      localStorage.setItem(`notification_prefs_${user.id}`, JSON.stringify(prefs));
    }
  };

  const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const form = useForm<PerfilForm>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nome: profile?.nome || '',
      senha_atual: '',
      nova_senha: '',
      confirmar_senha: '',
    },
  });

  const validateImageFile = (file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return t('userProfilePopover.invalidImageFormat');
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return t('userProfilePopover.fileTooLarge');
    }
    
    return null;
  };

  const handlePhotoUpload = async (file: File) => {
    if (!user) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ foto_url: urlData.publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setFotoUrl(urlData.publicUrl);
      await refetchProfile();
      toast.success(t('userProfilePopover.photoUpdated'));
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      toast.error(t('userProfilePopover.photoError'));
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfileSubmit = async (data: PerfilForm) => {
    try {
      // Atualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ nome: data.nome })
        .eq('user_id', user?.id);

      if (profileError) throw profileError;

      // Atualizar senha se fornecida
      if (data.nova_senha && data.senha_atual) {
        // Validar senha atual via re-autenticação
        const { error: reAuthError } = await supabase.auth.signInWithPassword({
          email: user?.email || '',
          password: data.senha_atual,
        });

        if (reAuthError) {
          toast.error(t('userProfilePopover.incorrectCurrentPassword'));
          return;
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.nova_senha
        });

        if (passwordError) throw passwordError;
      }

      await refetchProfile();
      toast.success(t('userProfilePopover.profileUpdated'));
      
      // Limpar campos de senha
      form.reset({
        nome: data.nome,
        senha_atual: '',
        nova_senha: '',
        confirmar_senha: '',
      });

      // Fechar popover após sucesso
      if (onClose) {
        setTimeout(onClose, 500);
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error(t('userProfilePopover.profileError'));
    }
  };

  const togglePasswordVisibility = (field: 'atual' | 'nova' | 'confirmar') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Foto de Perfil */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar className="h-24 w-24 cursor-pointer" onClick={handlePhotoClick}>
            <AvatarImage src={fotoUrl || (profile as any)?.foto_url} alt={user?.email || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {getInitials(form.watch('nome') || (profile as any)?.nome || user?.email || '')}
            </AvatarFallback>
          </Avatar>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full">
              <AkurisPulse size={24} />
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handlePhotoUpload(file);
          }}
          disabled={uploading}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {t('userProfilePopover.changePhoto')}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          {t('userProfilePopover.photoFormats')}
        </p>
      </div>

      {/* Formulário */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('userProfilePopover.name')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('userProfilePopover.namePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Separador */}
          <div className="pt-4">
            <Separator className="my-5" />
            <h3 className="text-sm font-semibold mb-5">{t('userProfilePopover.changePassword')}</h3>
          </div>

          <div className="space-y-4">
            
            <FormField
              control={form.control}
              name="senha_atual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('userProfilePopover.currentPassword')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPasswords.atual ? "text" : "password"}
                        placeholder={t('userProfilePopover.currentPasswordPlaceholder')}
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility('atual')}
                      >
                        {showPasswords.atual ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nova_senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('userProfilePopover.newPassword')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPasswords.nova ? "text" : "password"}
                        placeholder={t('userProfilePopover.newPasswordPlaceholder')}
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility('nova')}
                      >
                        {showPasswords.nova ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmar_senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('userProfilePopover.confirmNewPassword')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPasswords.confirmar ? "text" : "password"}
                        placeholder={t('userProfilePopover.confirmNewPasswordPlaceholder')}
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility('confirmar')}
                      >
                        {showPasswords.confirmar ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Botão Salvar */}
          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? t('userProfilePopover.saving') : t('userProfilePopover.saveChanges')}
            </Button>
          </div>
        </form>
      </Form>

      {/* Preferências de Notificação */}
      <div className="pt-2">
        <Separator className="my-5" />
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4" />
          {t('userProfilePopover.notifications')}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pp-email-notif" className="text-sm">{t('userProfilePopover.emailNotif')}</Label>
              <p className="text-xs text-muted-foreground">{t('userProfilePopover.emailNotifDesc')}</p>
            </div>
            <Switch
              id="pp-email-notif"
              checked={notificationPrefs.email_notifications}
              onCheckedChange={(checked) =>
                saveNotificationPrefs({ ...notificationPrefs, email_notifications: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pp-inapp-notif" className="text-sm">{t('userProfilePopover.inAppNotif')}</Label>
              <p className="text-xs text-muted-foreground">{t('userProfilePopover.inAppNotifDesc')}</p>
            </div>
            <Switch
              id="pp-inapp-notif"
              checked={notificationPrefs.in_app_notifications}
              onCheckedChange={(checked) =>
                saveNotificationPrefs({ ...notificationPrefs, in_app_notifications: checked })
              }
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">{t('userProfilePopover.frequency')}</Label>
            <div className="flex gap-1.5">
              {[
                { value: 'realtime' as const, label: t('userProfilePopover.realtime') },
                { value: 'daily' as const, label: t('userProfilePopover.daily') },
                { value: 'weekly' as const, label: t('userProfilePopover.weekly') },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  variant={notificationPrefs.digest_frequency === opt.value ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() =>
                    saveNotificationPrefs({ ...notificationPrefs, digest_frequency: opt.value })
                  }
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
