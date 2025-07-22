
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
  const { user, refetchProfile, company, forceLogoUpdate } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
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

  // Tipos de arquivo aceitos para logos
  const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

  // Reset preview quando o company logo mudar
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

      setUserProfile({ ...userProfile, foto_url: urlData.publicUrl });
      toast.success('Foto atualizada com sucesso');
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      toast.error('Erro ao fazer upload da foto');
    } finally {
      setUploading(false);
    }
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
    console.log('=== INÍCIO DO UPLOAD DO LOGO ===');
    console.log('Usuário:', user?.email);
    console.log('Role do usuário:', userRole);
    console.log('Empresa ID:', userProfile?.empresa_id);
    console.log('É admin?', isAdmin);

    if (!userProfile?.empresa_id) {
      console.error('Empresa não encontrada no perfil do usuário');
      toast.error('Empresa não encontrada');
      return;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      console.error('Erro de validação do arquivo:', validationError);
      toast.error(validationError);
      return;
    }

    try {
      setUploading(true);
      
      // Criar preview imediato do arquivo
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `empresa-${userProfile.empresa_id}-${timestamp}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log('Iniciando upload para o storage...');
      console.log('Bucket: empresa-logos');
      console.log('Arquivo:', filePath);
      console.log('Tamanho do arquivo:', file.size, 'bytes');

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('empresa-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('ERRO NO UPLOAD PARA O STORAGE:', uploadError);
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      console.log('✅ Upload para storage bem-sucedido:', uploadData);

      const { data: urlData } = supabase.storage
        .from('empresa-logos')
        .getPublicUrl(filePath);

      // URL com cache busting para garantir refresh
      const logoUrlWithCacheBusting = `${urlData.publicUrl}?t=${timestamp}`;

      console.log('URL pública gerada:', logoUrlWithCacheBusting);

      // Verificar se a imagem está acessível
      console.log('Verificando se a imagem está acessível...');
      const isImageReady = await verifyImageLoad(logoUrlWithCacheBusting);
      if (!isImageReady) {
        console.error('Imagem não está acessível após upload');
        throw new Error('Falha ao verificar se a imagem foi carregada corretamente');
      }

      console.log('✅ Imagem verificada como acessível');

      console.log('Atualizando tabela empresas...');
      console.log('Empresa ID:', userProfile.empresa_id);
      console.log('Nova logo_url:', logoUrlWithCacheBusting);

      const { error: updateError, data: updateData } = await supabase
        .from('empresas')
        .update({ logo_url: logoUrlWithCacheBusting })
        .eq('id', userProfile.empresa_id)
        .select();

      if (updateError) {
        console.error('ERRO AO ATUALIZAR TABELA EMPRESAS:', updateError);
        throw new Error(`Erro ao atualizar banco: ${updateError.message}`);
      }

      console.log('✅ Banco de dados atualizado:', updateData);

      console.log('Chamando refetchProfile...');

      // Forçar atualização imediata do contexto
      await refetchProfile();
      
      // Forçar re-render de todos os componentes que usam logo
      forceLogoUpdate();

      console.log('=== UPLOAD CONCLUÍDO COM SUCESSO ===');
      toast.success('Logo da empresa atualizado com sucesso');

    } catch (error: any) {
      console.error('=== ERRO NO UPLOAD DO LOGO ===');
      console.error('Tipo do erro:', error.constructor.name);
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
      console.error('Objeto completo:', error);
      
      // Mensagem de erro mais específica para o usuário
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

  const togglePasswordVisibility = (field: 'atual' | 'nova' | 'confirmar') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getCurrentCompanyLogo = () => {
    // Primeiro mostra o preview se existir
    if (logoPreview) return logoPreview;
    // Depois o logo da empresa do contexto com cache busting
    if (company?.logo_url) {
      const hasTimestamp = company.logo_url.includes('?t=');
      return hasTimestamp ? company.logo_url : `${company.logo_url}?t=${Date.now()}`;
    }
    // Por último um placeholder
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Configurações do Sistema - Apenas para Admins */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Logo da Empresa
              </label>
              <div className="flex items-center gap-4">
                {getCurrentCompanyLogo() && (
                  <div className="relative">
                    <img
                      key={`company-logo-${Date.now()}`} // Força re-render sempre
                      src={getCurrentCompanyLogo()!}
                      alt="Logo da empresa"
                      className={`h-16 w-auto max-w-[120px] object-contain border-2 border-border rounded ${
                        uploading ? 'opacity-50' : ''
                      }`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex flex-col gap-2">
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
                  <div className="text-sm text-muted-foreground">
                    <p>Será exibido no menu lateral e tela de login</p>
                    <p className="text-xs">Formatos aceitos: JPG, PNG, GIF, SVG, WebP (máx. 5MB)</p>
                  </div>
                </div>
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
                    accept={ACCEPTED_IMAGE_TYPES.join(',')}
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
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: JPG, PNG, GIF, SVG, WebP (máx. 5MB)
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
