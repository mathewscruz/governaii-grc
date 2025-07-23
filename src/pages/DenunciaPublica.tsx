import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Send, AlertTriangle, Shield, Search, QrCode } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface Empresa {
  id: string;
  nome: string;
  slug: string;
}

interface EmpresaConfig {
  id: string;
  empresa_id: string;
  ativo: boolean;
  token_publico: string;
  permitir_anonimas: boolean;
  requerer_email: boolean;
  texto_apresentacao: string;
  politica_privacidade: string;
}

interface Categoria {
  id: string;
  nome: string;
  descricao: string;
  cor: string;
}

export default function DenunciaPublica() {
  const { empresa: empresaSlug } = useParams<{ empresa: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [config, setConfig] = useState<EmpresaConfig | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [protocolo, setProtocolo] = useState<string>('');
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    anonima: false,
    categoria_id: '',
    titulo: '',
    descricao: '',
    gravidade: 'media',
    politica_aceita: false
  });
  const [arquivos, setArquivos] = useState<File[]>([]);

  useEffect(() => {
    console.log('🚀 [DEBUG] DenunciaPublica iniciada - empresa slug:', empresaSlug);
    console.log('🚀 [DEBUG] URL atual:', window.location.href);
    console.log('🚀 [DEBUG] Parâmetros de rota capturados:', { empresaSlug });
    
    if (empresaSlug) {
      carregarConfiguracao();
    } else {
      console.log('❌ [ERROR] Slug da empresa não fornecido');
      navigate('/');
    }
  }, [empresaSlug]);

  const carregarConfiguracao = async () => {
    try {
      setLoading(true);
      console.log('🔍 [DEBUG] Carregando configuração para empresa slug:', empresaSlug);
      
      // Normalizar slug (lowercase, trim)
      const slugNormalizado = empresaSlug?.toLowerCase().trim();
      console.log('🔍 [DEBUG] Slug normalizado:', slugNormalizado);
      
      // Buscar empresa por slug
      const { data: empresaData, error: empresaError } = await supabase
        .from('empresas')
        .select('id, nome, slug')
        .eq('slug', slugNormalizado)
        .eq('ativo', true)
        .single();
      
      console.log('🔍 [DEBUG] Resultado busca empresa:', { empresaData, empresaError });

      if (empresaError || !empresaData) {
        console.log('❌ [ERROR] Empresa não encontrada para slug:', slugNormalizado);
        console.log('❌ [ERROR] Erro de busca:', empresaError);
        toast({
          title: "Empresa não encontrada",
          description: "A empresa especificada não foi encontrada.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      console.log('✅ [SUCCESS] Empresa carregada:', empresaData.nome);
      setEmpresa(empresaData);

      // Buscar configuração da empresa
      console.log('🔍 [DEBUG] Buscando configuração de denúncias para empresa ID:', empresaData.id);
      const { data: configData, error: configError } = await supabase
        .from('denuncias_configuracoes')
        .select('*')
        .eq('empresa_id', empresaData.id)
        .eq('ativo', true)
        .single();
      
      console.log('🔍 [DEBUG] Configuração de denúncias:', { configData, configError });

      if (configError || !configData) {
        console.log('❌ [ERROR] Configuração não encontrada:', configError);
        toast({
          title: "Canal não disponível",
          description: "O canal de denúncias não está configurado para esta empresa.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      console.log('✅ [SUCCESS] Configuração carregada - Canal ativo');
      setConfig(configData);

      // Buscar categorias
      console.log('🔍 [DEBUG] Buscando categorias para empresa ID:', empresaData.id);
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('denuncias_categorias')
        .select('*')
        .eq('empresa_id', empresaData.id)
        .eq('ativo', true)
        .order('nome');

      console.log('🔍 [DEBUG] Categorias encontradas:', { categoriasData, categoriasError });

      if (!categoriasError && categoriasData) {
        console.log('✅ [SUCCESS] Categorias carregadas:', categoriasData.length);
        setCategorias(categoriasData);
      }
    } catch (error) {
      console.error('❌ [ERROR] Erro geral ao carregar configuração:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado. Tente novamente mais tarde.",
        variant: "destructive"
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!config || !empresa) return;

    if (!formData.politica_aceita) {
      toast({
        title: "Erro",
        description: "Você deve aceitar a política de privacidade",
        variant: "destructive"
      });
      return;
    }

    if (config.requerer_email && !formData.email) {
      toast({
        title: "Erro",
        description: "E-mail é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      // Gerar protocolo e token únicos
      const { data: protocoloData } = await supabase.rpc('gerar_protocolo_denuncia');
      const { data: tokenData } = await supabase.rpc('gerar_token_publico');

      const denunciaData = {
        empresa_id: empresa.id,
        token_publico: tokenData,
        protocolo: protocoloData,
        nome_denunciante: formData.anonima ? null : formData.nome,
        email_denunciante: formData.anonima ? null : formData.email,
        anonima: formData.anonima,
        categoria_id: formData.categoria_id || null,
        titulo: formData.titulo,
        descricao: formData.descricao,
        gravidade: formData.gravidade,
        politica_aceita: formData.politica_aceita,
        ip_origem: await obterIP(),
        user_agent: navigator.userAgent
      };

      const { data: denuncia, error: denunciaError } = await supabase
        .from('denuncias')
        .insert(denunciaData)
        .select()
        .single();

      if (denunciaError) throw denunciaError;

      // Upload de arquivos se houver
      if (arquivos.length > 0 && denuncia) {
        await uploadArquivos(denuncia.id);
      }

      // Registrar movimentação inicial
      await supabase
        .from('denuncias_movimentacoes')
        .insert({
          denuncia_id: denuncia.id,
          acao: 'denuncia_criada',
          status_novo: 'nova',
          observacoes: 'Denúncia criada via formulário externo'
        });

      setProtocolo(protocoloData);
    } catch (error) {
      console.error('Erro ao enviar denúncia:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar denúncia. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const uploadArquivos = async (denunciaId: string) => {
    for (const arquivo of arquivos) {
      const fileName = `${denunciaId}/${Date.now()}-${arquivo.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('denuncias-anexos')
        .upload(fileName, arquivo);

      if (!uploadError) {
        await supabase
          .from('denuncias_anexos')
          .insert({
            denuncia_id: denunciaId,
            nome_arquivo: arquivo.name,
            tipo_arquivo: arquivo.type,
            tamanho_arquivo: arquivo.size,
            arquivo_url: fileName,
            tipo_anexo: 'denuncia'
          });
      }
    }
  };

  const obterIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return null;
    }
  };

  const linkConsulta = empresa ? `/${empresa.slug}/denuncia/consulta` : '#';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (protocolo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-green-700">Denúncia Enviada</CardTitle>
            <CardDescription>
              Sua denúncia foi recebida com sucesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium">Protocolo</Label>
              <div className="text-lg font-mono font-bold mt-1">{protocolo}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Guarde este número para acompanhar sua denúncia
              </p>
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Sua denúncia será analisada pela equipe responsável. 
                O tratamento será feito de forma confidencial e imparcial.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <Link to={linkConsulta}>
                  <Search className="w-4 h-4 mr-2" />
                  Consultar Status
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/${empresa?.slug}/denuncia`}>
                  Nova Denúncia
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 py-8">
      <div className="container max-w-2xl mx-auto px-4">
        {/* Header com link de consulta */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            {empresa?.nome}
          </h1>
          <p className="text-muted-foreground mb-4">
            Canal de Denúncia
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link to={linkConsulta}>
              <Search className="w-4 h-4 mr-2" />
              Consultar Protocolo
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Faça sua Denúncia
            </CardTitle>
            <CardDescription>
              {config?.texto_apresentacao || 
               "Utilize este canal para reportar irregularidades de forma segura e confidencial"}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Opção de anonimato */}
              {config?.permitir_anonimas && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="anonima"
                    checked={formData.anonima}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, anonima: checked as boolean }))}
                  />
                  <Label htmlFor="anonima">Denúncia anônima</Label>
                </div>
              )}

              {/* Dados do denunciante (se não anônima) */}
              {!formData.anonima && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome (opcional)</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      E-mail {config?.requerer_email && "(obrigatório)"}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="seu@email.com"
                      required={config?.requerer_email}
                    />
                  </div>
                </div>
              )}

              {/* Categoria */}
              <div className="space-y-2">
                <Label htmlFor="categoria">Tipo de denúncia</Label>
                <Select 
                  value={formData.categoria_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoria_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="titulo">Título da denúncia</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Resumo da situação"
                  required
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição detalhada</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descreva detalhadamente a situação..."
                  rows={6}
                  required
                />
              </div>

              {/* Gravidade */}
              <div className="space-y-2">
                <Label htmlFor="gravidade">Gravidade</Label>
                <Select 
                  value={formData.gravidade} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gravidade: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Upload de arquivos */}
              <div className="space-y-2">
                <Label>Anexos (opcional)</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Arraste arquivos ou clique para selecionar
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => setArquivos(Array.from(e.target.files || []))}
                    className="mt-2"
                  />
                </div>
                {arquivos.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {arquivos.length} arquivo(s) selecionado(s)
                  </div>
                )}
              </div>

              {/* Política de privacidade */}
              <div className="space-y-4">
                {config?.politica_privacidade && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Política de Privacidade</h4>
                    <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto">
                      {config.politica_privacidade}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="politica"
                    checked={formData.politica_aceita}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, politica_aceita: checked as boolean }))}
                    required
                  />
                  <Label htmlFor="politica" className="text-sm">
                    Aceito a política de privacidade e confirmo que as informações são verdadeiras
                  </Label>
                </div>
              </div>

              {/* Botão enviar */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={submitting || !formData.politica_aceita}
              >
                <Send className="w-4 h-4 mr-2" />
                {submitting ? 'Enviando...' : 'Enviar Denúncia'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}