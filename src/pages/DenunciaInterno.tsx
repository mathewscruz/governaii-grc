import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, Search, Settings, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface Empresa {
  id: string;
  nome: string;
  slug: string;
}

export default function DenunciaInterno() {
  const { company } = useAuth();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEmpresaData = async () => {
      if (!company?.id) {
        setLoading(false);
        return;
      }

      try {
        // Buscar dados completos da empresa incluindo slug
        const { data: empresaData, error: empresaError } = await supabase
          .from('empresas')
          .select('id, nome, slug')
          .eq('id', company.id)
          .single();

        if (!empresaError && empresaData) {
          setEmpresa(empresaData);
        }

        // Buscar logotipo da empresa
        const logoPath = `${company.id}/logo.png`;
        const { data: logoData } = await supabase.storage
          .from('empresa-logos')
          .getPublicUrl(logoPath);
          
        if (logoData?.publicUrl) {
          try {
            const response = await fetch(logoData.publicUrl, { method: 'HEAD' });
            if (response.ok) {
              setLogoUrl(logoData.publicUrl);
            }
          } catch (error) {
            console.log('Logotipo não encontrado para empresa');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar logotipo:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEmpresaData();
  }, [company?.id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Canal de Denúncia</h1>
          <p className="text-muted-foreground">
            Gerencie denúncias e mantenha um ambiente ético e transparente
          </p>
        </div>
      </div>

      {/* Header com logotipo e informações da empresa */}
      <div className="text-center mb-8">
        {/* Logotipo da empresa */}
        {logoUrl && (
          <div className="mb-6">
            <img 
              src={logoUrl} 
              alt={`Logo ${empresa?.nome || company?.nome}`}
              className="mx-auto h-20 w-auto object-contain"
              onError={() => setLogoUrl('')}
            />
          </div>
        )}
        
        <h2 className="text-2xl font-semibold mb-2">
          {empresa?.nome || company?.nome}
        </h2>
        
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="w-6 h-6 text-primary" />
          <p className="text-xl text-muted-foreground">Sistema de Denúncias</p>
        </div>
      </div>

      {/* Opções principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
        {/* Canal Público */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Canal Público</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Acesse o canal público de denúncias para registrar ou consultar
              </p>
              <Link to={`/${empresa?.slug}/denuncia`} target="_blank" rel="noopener noreferrer">
                <Button className="w-full">
                  Acessar Canal Público
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Administração */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Administração</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Gerencie denúncias, configurações e categorias
              </p>
              <Link to="/denuncia/admin">
                <Button variant="outline" className="w-full">
                  Acessar Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Relatórios */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Relatórios</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Visualize estatísticas e relatórios das denúncias
              </p>
              <Link to="/denuncia/admin?tab=relatorios">
                <Button variant="outline" className="w-full">
                  Ver Relatórios
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações complementares */}
      <Card className="bg-primary/5 border-primary/20 max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
            <h4 className="font-semibold mb-2">Sistema Integrado de Denúncias</h4>
            <p className="text-sm text-muted-foreground">
              Este sistema permite o gerenciamento completo do canal de denúncias da empresa, 
              garantindo confidencialidade, transparência e eficiência no tratamento de todas as ocorrências.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}