import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { toast } from 'sonner';

const SETORES = [
  'Financeiro / Bancário',
  'Saúde',
  'Tecnologia',
  'Varejo / E-commerce',
  'Indústria / Manufatura',
  'Educação',
  'Governo / Setor Público',
  'Telecomunicações',
  'Energia / Utilities',
  'Logística / Transporte',
  'Agronegócio',
  'Jurídico / Advocacia',
  'Seguros',
  'Outro',
];

const PORTES = [
  { value: 'micro', label: 'Micro (até 9 funcionários)' },
  { value: 'pequena', label: 'Pequena (10-49 funcionários)' },
  { value: 'media', label: 'Média (50-249 funcionários)' },
  { value: 'grande', label: 'Grande (250-999 funcionários)' },
  { value: 'enterprise', label: 'Enterprise (1000+ funcionários)' },
];

export function CompanyContextSettings() {
  const { empresaId } = useEmpresaId();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [setor, setSetor] = useState('');
  const [porte, setPorte] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [dataAlvo, setDataAlvo] = useState('');

  useEffect(() => {
    if (!empresaId) return;
    const load = async () => {
      setFetching(true);
      const { data } = await supabase
        .from('empresas')
        .select('setor_atuacao, porte_empresa, objetivo_compliance, data_alvo_certificacao')
        .eq('id', empresaId)
        .single();
      if (data) {
        setSetor((data as any).setor_atuacao || '');
        setPorte((data as any).porte_empresa || '');
        setObjetivo((data as any).objetivo_compliance || '');
        setDataAlvo((data as any).data_alvo_certificacao || '');
      }
      setFetching(false);
    };
    load();
  }, [empresaId]);

  const handleSave = async () => {
    if (!empresaId) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('empresas')
        .update({
          setor_atuacao: setor || null,
          porte_empresa: porte || null,
          objetivo_compliance: objetivo || null,
          data_alvo_certificacao: dataAlvo || null,
        } as any)
        .eq('id', empresaId);
      if (error) throw error;
      toast.success('Contexto da organização salvo com sucesso');
    } catch {
      toast.error('Erro ao salvar contexto');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="h-5 w-5 text-primary" />
        <div>
          <h3 className="font-semibold text-base">Contexto da Organização</h3>
          <p className="text-sm text-muted-foreground">
            Essas informações personalizam as orientações da IA para o setor e porte da sua empresa em todos os frameworks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Setor de Atuação</Label>
          <Select value={setor} onValueChange={setSetor}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o setor" />
            </SelectTrigger>
            <SelectContent>
              {SETORES.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Porte da Empresa</Label>
          <Select value={porte} onValueChange={setPorte}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o porte" />
            </SelectTrigger>
            <SelectContent>
              {PORTES.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Objetivo de Compliance</Label>
          <Textarea
            placeholder="Ex: Obter certificação ISO 27001, adequar-se à LGPD, atender requisitos de clientes..."
            value={objetivo}
            onChange={e => setObjetivo(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Data Alvo para Certificação</Label>
          <Input
            type="date"
            value={dataAlvo}
            onChange={e => setDataAlvo(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Salvando...' : 'Salvar Contexto'}
        </Button>
      </div>
    </div>
  );
}
