import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { Upload, User, Settings, Eye, EyeOff } from 'lucide-react';

const perfilSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  senha_atual: z.string().optional(),
  nova_senha: z.string().optional(),
  confirmar_senha: z.string().optional(),
}).refine((data) => {
  if (data.nova_senha || data.confirmar_senha) {
    return data.senha_atual && data.nova_senha === data.confirmar_senha;
  }
  return true;
}, {
  message: "As senhas não coincidem ou senha atual não foi informada",
  path: ["confirmar_senha"],
});

type PerfilForm = z.infer<typeof perfilSchema>;

interface Props {
  userRole: string;
}

const ConfiguracoesGerais = ({ userRole }: Props) => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    atual: false,
    nova: false,
    confirmar: false,
  });

  const form = useForm<PerfilForm>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nome: '',
      senha_atual: '',
      nova_senha: '',
      confirmar_senha: '',
    },
  });

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

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
          form.reset({
            nome: data.nome,
            senha_atual: '',
            nova_senha: '',
            confirmar_senha: '',
          });
        }
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        toast.error('Erro ao carregar perfil');
      }
    };

    fetchUserProfile();
  }, [user, form]);

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
        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.nova_senha
        });

        if (passwordError) throw passwordError;
      }

      toast.success('Perfil atualizado com sucesso');
      
      // Limpar campos de senha
      form.reset({
        nome: data.nome,
        senha_atual: '',
        nova_senha: '',
        confirmar_senha: '',
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!user) return;

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

      setUserProfile({ ...userProfile, foto_url: urlData.publicUrl });
      toast.success('Foto atualizada com sucesso');
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      toast.error('Erro ao fazer upload da foto');
    } finally {
      setUploading(false);
    }
  };

  const handleSystemLogoUpload = async (file: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `sistema-logo.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('empresa-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      toast.success('Logo do sistema atualizado com sucesso');
      toast.info('Recarregue a página para ver as alterações');
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error);
      toast.error('Erro ao fazer upload do logo');
    } finally {
      setUploading(false);
    }
  };

  const togglePasswordVisibility = (field: 'atual' | 'nova' | 'confirmar') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Configurações do Sistema - Apenas para Admins */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Logo Principal do Sistema
              </label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSystemLogoUpload(file);
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
                <p className="text-sm text-muted-foreground">
                  Será exibido no menu lateral do sistema
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edição de Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Meu Perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Foto de Perfil */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {userProfile?.foto_url ? (
                  <img
                    src={userProfile.foto_url}
                    alt="Foto de perfil"
                    className="h-20 w-20 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file);
                    }}
                    disabled={uploading}
                  />
                  <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                    <Upload className="h-3 w-3 text-primary-foreground" />
                  </div>
                </label>
              </div>
              <div>
                <h3 className="font-medium">Foto de Perfil</h3>
                <p className="text-sm text-muted-foreground">
                  Clique no ícone para alterar sua foto
                </p>
              </div>
            </div>

            {/* Formulário de Perfil */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Alterar Senha</h4>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="senha_atual"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha Atual</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPasswords.atual ? "text" : "password"}
                                placeholder="Digite sua senha atual"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => togglePasswordVisibility('atual')}
                              >
                                {showPasswords.atual ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
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
                          <FormLabel>Nova Senha</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPasswords.nova ? "text" : "password"}
                                placeholder="Digite sua nova senha"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => togglePasswordVisibility('nova')}
                              >
                                {showPasswords.nova ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
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
                          <FormLabel>Confirmar Nova Senha</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPasswords.confirmar ? "text" : "password"}
                                placeholder="Confirme sua nova senha"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => togglePasswordVisibility('confirmar')}
                              >
                                {showPasswords.confirmar ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit">
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfiguracoesGerais;