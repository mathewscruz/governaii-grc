import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, FileText, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface Empresa {
  id: string;
  nome: string;
  slug: string;
  logo_url?: string;
}

export default function DenunciaMenu() {
  const { empresa: empresaSlug } = useParams();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEmpresaData = async () => {
      if (!empresaSlug) {
        console.error('❌ [ERROR] Slug da empresa não fornecido');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 [DEBUG] Carregando dados para empresa slug:', empresaSlug);
        
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
          console.error('❌ [ERROR] Erro ao buscar empresa:', empresaError);
          setLoading(false);
          return;
        }

        if (!empresaData) {
          console.error('❌ [ERROR] Empresa não encontrada para slug:', normalizedSlug);
          setLoading(false);
          return;
        }

        console.log('✅ [SUCCESS] Empresa encontrada:', empresaData);
        setEmpresa(empresaData);

        // Usar logo_url da base de dados se disponível
        if (empresaData.logo_url) {
          console.log('✅ [SUCCESS] Logotipo encontrado na base de dados:', empresaData.logo_url);
          setLogoUrl(empresaData.logo_url);
        } else {
          console.log('ℹ️ [INFO] Nenhum logotipo cadastrado para esta empresa');
        }
      } catch (error) {
        console.error('❌ [ERROR] Erro geral ao carregar configuração:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEmpresaData();
  }, [empresaSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Empresa não encontrada</h2>
            <p className="text-muted-foreground">
              O canal de denúncias solicitado não está disponível ou foi desativado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(215,35%,12%)] py-8">
      <div className="container max-w-2xl mx-auto px-4">
        {/* Header com logotipo */}
        <div className="text-center mb-8">
          {/* Logotipo da empresa */}
          {logoUrl && (
            <div className="mb-6">
              <img 
                src={logoUrl} 
                alt={`Logo ${empresa.nome}`}
                className="mx-auto h-20 w-auto object-contain"
                onError={() => setLogoUrl('')}
              />
            </div>
          )}
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-6 h-6 text-primary" />
            <h2 className="text-xl text-sidebar-foreground">Canal de Denúncias</h2>
          </div>
        </div>

        {/* Card principal com opções */}
        <Card className="mb-8 bg-white">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-semibold mb-2">Como podemos ajudá-lo?</h3>
              <p className="text-muted-foreground">
                Escolha uma das opções abaixo para prosseguir
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Registrar Nova Denúncia */}
              <Link to={`/${empresaSlug}/denuncia/registrar`}>
                <Button
                  variant="outline"
                  className="w-full h-auto p-6 border-2 hover:border-primary transition-colors"
                >
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-primary" />
                    <h4 className="text-lg font-semibold mb-2">Registrar Denúncia</h4>
                    <p className="text-sm text-muted-foreground">
                      Reportar uma irregularidade ou violação
                    </p>
                  </div>
                </Button>
              </Link>

              {/* Consultar Denúncia */}
              <Link to={`/${empresaSlug}/denuncia/consulta`}>
                <Button
                  variant="outline"
                  className="w-full h-auto p-6 border-2 hover:border-primary transition-colors"
                >
                  <div className="text-center">
                    <Search className="w-12 h-12 mx-auto mb-3 text-primary" />
                    <h4 className="text-lg font-semibold mb-2">Consultar Denúncia</h4>
                    <p className="text-sm text-muted-foreground">
                      Acompanhar o status de um protocolo
                    </p>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Informações complementares */}
        <Card className="bg-white border-primary/20">
          <CardContent className="p-6">
            <div className="text-center">
              <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Confidencialidade Garantida</h4>
              <p className="text-sm text-muted-foreground">
                Todas as denúncias são tratadas com total confidencialidade e seriedade. 
                Sua identidade será protegida conforme nossa política de privacidade.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}