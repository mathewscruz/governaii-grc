import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Fornecedor {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cnpj?: string;
  categoria?: string;
  status?: string;
}

interface FornecedorSelectorProps {
  value?: { nome: string; email: string };
  onChange: (fornecedor: { nome: string; email: string }) => void;
}

export function FornecedorSelector({ value, onChange }: FornecedorSelectorProps) {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [manualMode, setManualMode] = useState(true); // Começar sempre no modo manual
  const { toast } = useToast();

  const fetchFornecedores = async () => {
    try {
      setLoading(true);
      
      // Buscar fornecedores da tabela
      const { data: fornecedoresData, error } = await supabase
        .from('fornecedores')
        .select('id, nome, email, telefone, cnpj');

      if (error) {
        console.error('Erro ao buscar fornecedores:', error);
        toast({
          title: "Informação",
          description: "Nenhum fornecedor encontrado. Use a entrada manual.",
        });
        setManualMode(true);
        return;
      }

      if (fornecedoresData && fornecedoresData.length > 0) {
        setFornecedores(fornecedoresData as Fornecedor[]);
        setManualMode(false);
        toast({
          title: "Fornecedores carregados",
          description: `${fornecedoresData.length} fornecedor(es) encontrado(s).`,
        });
      } else {
        setManualMode(true);
        toast({
          title: "Informação",
          description: "Nenhum fornecedor cadastrado. Use a entrada manual.",
        });
      }
      
    } catch (error: any) {
      console.error('Erro ao buscar fornecedores:', error);
      setManualMode(true);
      toast({
        title: "Erro",
        description: "Erro ao buscar fornecedores. Use a entrada manual.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredFornecedores = fornecedores.filter(f =>
    f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.cnpj && f.cnpj.includes(searchTerm))
  );

  const handleSelectFornecedor = (fornecedor: Fornecedor) => {
    onChange({
      nome: fornecedor.nome,
      email: fornecedor.email
    });
    setShowDialog(false);
  };

  if (manualMode || fornecedores.length === 0) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fornecedor-nome">Nome do Fornecedor *</Label>
            <Input
              id="fornecedor-nome"
              value={value?.nome || ''}
              onChange={(e) => onChange({ nome: e.target.value, email: value?.email || '' })}
              placeholder="Nome da empresa/fornecedor"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fornecedor-email">E-mail do Fornecedor *</Label>
            <Input
              id="fornecedor-email"
              type="email"
              value={value?.email || ''}
              onChange={(e) => onChange({ nome: value?.nome || '', email: e.target.value })}
              placeholder="contato@fornecedor.com"
              required
            />
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={fetchFornecedores}
          className="w-full"
          disabled={loading}
        >
          <Building2 className="mr-2 h-4 w-4" />
          {loading ? 'Carregando...' : 'Buscar Fornecedores Cadastrados'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Fornecedor</Label>
        <div className="flex gap-2">
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 justify-start">
                {value?.nome ? (
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{value.nome}</span>
                    <span className="text-sm text-muted-foreground">{value.email}</span>
                  </div>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Selecionar Fornecedor
                  </>
                )}
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Selecionar Fornecedor</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar por nome, e-mail ou CNPJ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Carregando fornecedores...</p>
                    </div>
                  ) : filteredFornecedores.length === 0 ? (
                    <div className="text-center py-8">
                      <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor disponível'}
                      </p>
                    </div>
                  ) : (
                    filteredFornecedores.map((fornecedor) => (
                      <Card 
                        key={fornecedor.id} 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSelectFornecedor(fornecedor)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{fornecedor.nome}</CardTitle>
                              <CardDescription>{fornecedor.email}</CardDescription>
                            </div>
                            {fornecedor.categoria && (
                              <Badge variant="outline">{fornecedor.categoria}</Badge>
                            )}
                          </div>
                        </CardHeader>
                        
                        {(fornecedor.telefone || fornecedor.cnpj) && (
                          <CardContent className="pt-0">
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              {fornecedor.cnpj && <span>CNPJ: {fornecedor.cnpj}</span>}
                              {fornecedor.telefone && <span>Tel: {fornecedor.telefone}</span>}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => setManualMode(true)}
            title="Inserir manualmente"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}