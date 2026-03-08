import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Shield, Upload, X, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface Empresa {
  id: string;
  nome: string;
  slug: string;
  logo_url?: string;
}

interface EmpresaConfig {
  id: string;
  empresa_id: string;
  ativo: boolean;
  permitir_anonimas: boolean;
  requerer_email: boolean;
  texto_apresentacao?: string;
  politica_privacidade?: string;
  emails_notificacao: string[];
  notificar_administradores: boolean;
  token_publico: string;
}

interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
}

const denunciaSchema = z.object({
  categoria_id: z.string().min(1, 'Categoria é obrigatória'),
  titulo: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  descricao: z.string().min(20, 'Descrição deve ter pelo menos 20 caracteres'),
  local_ocorrencia: z.string().optional(),
  data_ocorrencia: z.string().optional(),
  denunciante_nome: z.string().optional(),
  denunciante_email: z.string().email('Email inválido').optional().or(z.literal('')),
  denunciante_telefone: z.string().optional(),
  testemunhas: z.string().optional(),
  evidencias_descricao: z.string().optional(),
});

type DenunciaFormData = z.infer<typeof denunciaSchema>;

export default function DenunciaFormulario() {
  const { empresa: empresaSlug } = useParams();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [config, setConfig] = useState<EmpresaConfig | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [protocolo, setProtocolo] = useState<string>('');
  const [anexos, setAnexos] = useState<File[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<DenunciaFormData>({
    resolver: zodResolver(denunciaSchema),
    defaultValues: {
      categoria_id: '',
      titulo: '',
      descricao: '',
      local_ocorrencia: '',
      data_ocorrencia: '',
      denunciante_nome: '',
      denunciante_email: '',
      denunciante_telefone: '',
      testemunhas: '',
      evidencias_descricao: '',
    },
  });

  useEffect(() => {
    const loadConfiguracao = async () => {
      if (!empresaSlug) {
        logger.debug('Slug da empresa não fornecido', { module: 'DenunciaFormulario' });
        setLoading(false);
        return;
      }

      try {
        logger.debug('Carregando configuração para empresa slug', { module: 'DenunciaFormulario', action: empresaSlug });
        
        // Normalizar slug (lowercase e trim)
        const normalizedSlug = empresaSlug.toLowerCase().trim();
        
        // Buscar empresa pelo slug
        const { data: empresaData, error: empresaError } = await supabase
          .from('empresas')
          .select('id, nome, slug, logo_url')
          .eq('slug', normalizedSlug)
          .eq('ativo', true)
          .single();

        if (empresaError) {
          logger.error('Erro ao buscar empresa', { module: 'DenunciaFormulario', error: String(empresaError) });
          setLoading(false);
          return;
        }

        if (!empresaData) {
          logger.error('Empresa não encontrada para slug', { module: 'DenunciaFormulario', action: normalizedSlug });
          setLoading(false);
          return;
        }

        logger.debug('Empresa encontrada', { module: 'DenunciaFormulario' });
        setEmpresa(empresaData);

        // Buscar configurações da empresa
        logger.debug('Buscando configurações para empresa', { module: 'DenunciaFormulario' });
        const { data: configData, error: configError } = await supabase
          .from('denuncias_configuracoes_public' as any)
          .select('*')
          .eq('empresa_id', empresaData.id)
          .single() as { data: any; error: any };

        if (configError) {
          logger.error('Erro ao buscar configurações', { module: 'DenunciaFormulario', error: String(configError) });
          setLoading(false);
          return;
        }

        if (!configData?.ativo) {
          logger.debug('Canal de denúncia desativado', { module: 'DenunciaFormulario' });
          setLoading(false);
          return;
        }

        logger.debug('Configurações carregadas', { module: 'DenunciaFormulario' });
        setConfig(configData);

        // Buscar categorias ativas da empresa
        logger.debug('Buscando categorias', { module: 'DenunciaFormulario' });
        const { data: categoriasData, error: categoriasError } = await supabase
          .from('denuncias_categorias')
          .select('*')
          .eq('empresa_id', empresaData.id)
          .eq('ativo', true)
          .order('nome');

        if (!categoriasError && categoriasData) {
          logger.debug('Categorias carregadas', { module: 'DenunciaFormulario' });
          setCategorias(categoriasData);
        }

        // Usar logo_url da base de dados se disponível
        if (empresaData.logo_url) {
          logger.debug('Logotipo encontrado na base de dados', { module: 'DenunciaFormulario' });
          setLogoUrl(empresaData.logo_url);
        } else {
          logger.debug('Nenhum logotipo cadastrado para esta empresa', { module: 'DenunciaFormulario' });
        }
      } catch (error) {
        logger.error('Erro geral ao carregar configuração', { module: 'DenunciaFormulario', error: String(error) });
      } finally {
        setLoading(false);
      }
    };

    loadConfiguracao();
  }, [empresaSlug]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (anexos.length + files.length > 5) {
      toast.error('Máximo de 5 arquivos permitidos');
      return;
    }
    
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error(`Arquivo ${file.name} é muito grande (máximo 10MB)`);
        return false;
      }
      return true;
    });
    
    setAnexos(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setAnexos(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: DenunciaFormData) => {
    if (!empresa) return;
    
    setSubmitting(true);
    
    try {
      // Criar a denúncia usando Edge Function
      const { data: denunciaData, error: denunciaError } = await supabase.functions.invoke('create-denuncia', {
        body: {
          empresa_id: empresa.id,
          categoria_id: data.categoria_id,
          titulo: data.titulo,
          descricao: data.descricao,
          anonima: !data.denunciante_nome,
          email_denunciante: data.denunciante_email || null,
          nome_denunciante: data.denunciante_nome || null
        }
      });

      if (denunciaError) {
        logger.error('Erro ao criar denúncia', { module: 'DenunciaFormulario', error: String(denunciaError) });
        toast.error('Erro ao registrar denúncia');
        return;
      }

      setProtocolo(denunciaData.protocolo);

      // Upload de anexos se houver
      if (anexos.length > 0) {
        for (const file of anexos) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${denunciaData.id}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('denuncias-anexos')
            .upload(fileName, file);

          if (uploadError) {
            logger.error('Erro ao fazer upload', { module: 'DenunciaFormulario', error: String(uploadError) });
          }
        }
      }

      setShowSuccess(true);
      form.reset();
      setAnexos([]);
      
    } catch (error) {
      logger.error('Erro geral ao registrar denúncia', { module: 'DenunciaFormulario', error: String(error) });
      toast.error('Erro inesperado ao registrar denúncia');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(215,35%,12%)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sidebar-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!empresa || !config) {
    return (
      <div className="min-h-screen bg-[hsl(215,35%,12%)] flex items-center justify-center">
        <Card className="max-w-md mx-auto bg-white">
          <CardContent className="text-center py-8">
            <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Canal Indisponível</h2>
            <p className="text-muted-foreground">
              O canal de denúncias não está disponível ou foi desativado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[hsl(215,35%,12%)] py-8">
        <div className="container max-w-2xl mx-auto px-4">
          <Card className="bg-white border-green-200">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                Denúncia Registrada com Sucesso!
              </h2>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
                <p className="text-sm text-gray-600 mb-2">Seu protocolo de acompanhamento:</p>
                <p className="text-2xl font-mono font-bold text-green-700">{protocolo}</p>
              </div>
              
              <p className="text-green-700 mb-6">
                Guarde este número para acompanhar o status da sua denúncia.
                Você receberá atualizações sobre o andamento do caso.
              </p>
              
              <div className="space-y-3">
                <Link to={`/${empresaSlug}/denuncia/consulta`}>
                  <Button className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Consultar Status da Denúncia
                  </Button>
                </Link>
                
                <Link to={`/${empresaSlug}/denuncia`}>
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar ao Início
                  </Button>
                </Link>
              </div>
              
              {config.politica_privacidade && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600">{config.politica_privacidade}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(215,35%,12%)] py-8">
      <div className="container max-w-2xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            to={`/${empresaSlug}/denuncia`}
            className="inline-flex items-center text-sm text-sidebar-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar ao menu inicial
          </Link>
        </div>

        {/* Header com logotipo */}
        <div className="text-center mb-6">
          {/* Logotipo da empresa */}
          {logoUrl && (
            <div className="mb-6">
              <img 
                src={logoUrl} 
                alt={`Logo ${empresa?.nome}`}
                className="mx-auto h-20 w-auto object-contain"
                onError={() => setLogoUrl('')}
              />
            </div>
          )}
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-6 h-6 text-primary" />
            <h2 className="text-xl text-sidebar-foreground">Canal de Denúncias - Registrar Nova Denúncia</h2>
          </div>
        </div>

        {/* Texto de apresentação */}
        {config.texto_apresentacao && (
          <Alert className="mb-6 bg-white">
            <Shield className="h-4 w-4" />
            <AlertDescription>{config.texto_apresentacao}</AlertDescription>
          </Alert>
        )}

        {/* Formulário */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Registrar Denúncia</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Categoria */}
                <FormField
                  control={form.control}
                  name="categoria_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria da Denúncia *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categorias.map((categoria) => (
                            <SelectItem key={categoria.id} value={categoria.id}>
                              {categoria.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Título */}
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título da Denúncia *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Descreva brevemente o problema" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Descrição */}
                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição Detalhada *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Descreva detalhadamente o que aconteceu, quando, onde e quem estava envolvido"
                          className="min-h-[120px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Local de Ocorrência */}
                <FormField
                  control={form.control}
                  name="local_ocorrencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local da Ocorrência</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Onde aconteceu o fato relatado" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Data de Ocorrência */}
                <FormField
                  control={form.control}
                  name="data_ocorrencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Ocorrência</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dados do Denunciante (se não for obrigatório email) */}
                {config.permitir_anonimas && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Identificação (Opcional)</h3>
                    
                    <FormField
                      control={form.control}
                      name="denunciante_nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Seu nome completo" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="denunciante_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="seu@email.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="denunciante_telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="(11) 99999-9999" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Testemunhas */}
                <FormField
                  control={form.control}
                  name="testemunhas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Testemunhas</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Relate se há testemunhas e como contatá-las"
                          className="min-h-[80px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Evidências */}
                <FormField
                  control={form.control}
                  name="evidencias_descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Evidências</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Descreva as evidências que você possui (documentos, fotos, etc.)"
                          className="min-h-[80px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Upload de Anexos */}
                {true && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Anexar Arquivos</label>
                      <span className="text-xs text-muted-foreground">Máximo 5 arquivos de 10MB cada</span>
                    </div>
                    
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Clique para selecionar arquivos
                          </p>
                        </div>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                        />
                      </label>
                    </div>

                    {/* Lista de anexos */}
                    {anexos.length > 0 && (
                      <div className="space-y-2">
                        {anexos.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-sm truncate">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Botões de ação */}
                <div className="flex gap-4 pt-4">
                  <Link to={`/${empresaSlug}/denuncia`} className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      Cancelar
                    </Button>
                  </Link>
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? 'Enviando...' : 'Registrar Denúncia'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
