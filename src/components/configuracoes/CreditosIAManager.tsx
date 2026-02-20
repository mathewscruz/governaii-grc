import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DataTable } from '@/components/ui/data-table';
import { toast } from 'sonner';
import { Sparkles, Building2, RotateCcw, TrendingUp, History } from 'lucide-react';
import { formatDateOnly } from '@/lib/date-utils';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface EmpresaCredito {
  id: string;
  nome: string;
  creditos_consumidos: number;
  plano_nome: string;
  creditos_franquia: number;
}

interface ConsumoHistorico {
  id: string;
  user_id: string;
  funcionalidade: string;
  descricao: string | null;
  created_at: string;
  user_nome?: string;
}

export function CreditosIAManager() {
  const [empresas, setEmpresas] = useState<EmpresaCredito[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetConfirm, setResetConfirm] = useState<{ open: boolean; empresaId: string; empresaNome: string }>({
    open: false, empresaId: '', empresaNome: ''
  });
  const [historico, setHistorico] = useState<ConsumoHistorico[]>([]);
  const [historicoSheet, setHistoricoSheet] = useState<{ open: boolean; empresaNome: string }>({
    open: false, empresaNome: ''
  });
  const [historicoLoading, setHistoricoLoading] = useState(false);

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select(`
          id,
          nome,
          creditos_consumidos,
          plano:planos (
            nome,
            creditos_franquia
          )
        `)
        .order('nome');

      if (error) throw error;

      const mapped: EmpresaCredito[] = (data || []).map((e: any) => ({
        id: e.id,
        nome: e.nome,
        creditos_consumidos: e.creditos_consumidos || 0,
        plano_nome: e.plano?.nome || 'Sem plano',
        creditos_franquia: e.plano?.creditos_franquia || 0,
      }));

      setEmpresas(mapped);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
      toast.error('Erro ao carregar dados de créditos');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      const { error } = await supabase
        .from('empresas')
        .update({ creditos_consumidos: 0 })
        .eq('id', resetConfirm.empresaId);

      if (error) throw error;

      toast.success(`Créditos de "${resetConfirm.empresaNome}" resetados com sucesso`);
      setResetConfirm({ open: false, empresaId: '', empresaNome: '' });
      fetchEmpresas();
    } catch (error) {
      toast.error('Erro ao resetar créditos');
    }
  };

  const openHistorico = async (empresaId: string, empresaNome: string) => {
    setHistoricoSheet({ open: true, empresaNome });
    setHistoricoLoading(true);
    try {
      const { data, error } = await supabase
        .from('creditos_consumo')
        .select('id, user_id, funcionalidade, descricao, created_at')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch user names
      const userIds = [...new Set((data || []).map((d: any) => d.user_id).filter(Boolean))];
      let profilesMap: Record<string, string> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', userIds);
        
        (profiles || []).forEach((p: any) => {
          profilesMap[p.user_id] = p.nome;
        });
      }

      setHistorico((data || []).map((d: any) => ({
        ...d,
        user_nome: profilesMap[d.user_id] || 'Desconhecido'
      })));
    } catch (error) {
      toast.error('Erro ao carregar histórico');
    } finally {
      setHistoricoLoading(false);
    }
  };

  const totalConsumo = empresas.reduce((sum, e) => sum + e.creditos_consumidos, 0);
  const empresaMaisConsumo = empresas.length > 0 
    ? empresas.reduce((max, e) => e.creditos_consumidos > max.creditos_consumidos ? e : max, empresas[0])
    : null;

  const columns = [
    {
      key: 'nome',
      label: 'Empresa',
      sortable: true,
      render: (value: string) => <span className="font-medium">{value}</span>
    },
    {
      key: 'plano_nome',
      label: 'Plano',
      render: (value: string) => <Badge variant="outline">{value}</Badge>
    },
    {
      key: 'creditos_consumidos',
      label: 'Consumo',
      sortable: true,
      render: (value: number, row: EmpresaCredito) => {
        const percent = row.creditos_franquia > 0 ? (value / row.creditos_franquia) * 100 : 0;
        return (
          <div className="space-y-1 min-w-[140px]">
            <div className="flex items-center justify-between text-xs">
              <span>{value} / {row.creditos_franquia}</span>
              <span className="text-muted-foreground">{percent.toFixed(0)}%</span>
            </div>
            <Progress value={Math.min(percent, 100)} className="h-1.5" />
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (_: any, row: EmpresaCredito) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openHistorico(row.id, row.nome)}>
            <History className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setResetConfirm({ open: true, empresaId: row.id, empresaNome: row.nome })}
            className="text-destructive hover:text-destructive"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const historicoColumns = [
    {
      key: 'created_at',
      label: 'Data',
      render: (value: string) => formatDateOnly(value)
    },
    {
      key: 'user_nome',
      label: 'Usuário',
      render: (value: string) => <span className="font-medium">{value}</span>
    },
    {
      key: 'funcionalidade',
      label: 'Funcionalidade',
      render: (value: string) => <Badge variant="secondary">{value}</Badge>
    },
    {
      key: 'descricao',
      label: 'Descrição',
      render: (value: string | null) => value || <span className="text-muted-foreground">-</span>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total de Empresas"
          value={empresas.length}
          description="Com plano ativo"
          icon={<Building2 className="h-4 w-4" />}
        />
        <StatCard
          title="Créditos Consumidos"
          value={totalConsumo}
          description="Todas as empresas"
          icon={<Sparkles className="h-4 w-4" />}
        />
        <StatCard
          title="Maior Consumo"
          value={empresaMaisConsumo?.creditos_consumidos || 0}
          description={empresaMaisConsumo?.nome || '-'}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Consumo por Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={empresas}
            columns={columns}
            loading={loading}
            searchPlaceholder="Buscar empresa..."
            emptyState={{
              icon: <Sparkles className="h-8 w-8" />,
              title: "Nenhuma empresa encontrada",
              description: "Não há empresas cadastradas no sistema."
            }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={resetConfirm.open}
        onOpenChange={(open) => setResetConfirm(prev => ({ ...prev, open }))}
        title="Resetar Créditos"
        description={`Tem certeza que deseja zerar os créditos consumidos de "${resetConfirm.empresaNome}"? Esta ação não pode ser desfeita.`}
        confirmText="Resetar"
        variant="destructive"
        onConfirm={handleReset}
      />

      <Sheet open={historicoSheet.open} onOpenChange={(open) => setHistoricoSheet(prev => ({ ...prev, open }))}>
        <SheetContent className="w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Histórico de Consumo — {historicoSheet.empresaNome}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <DataTable
              data={historico}
              columns={historicoColumns}
              loading={historicoLoading}
              searchPlaceholder="Buscar no histórico..."
              emptyState={{
                icon: <History className="h-8 w-8" />,
                title: "Sem histórico",
                description: "Nenhum consumo de crédito registrado para esta empresa."
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
