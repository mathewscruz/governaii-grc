import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable, Column } from '@/components/ui/data-table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CheckCircle, AlertTriangle, Clock, CalendarX, MoreHorizontal, Eye, CalendarClock, XCircle, Download, FileText } from 'lucide-react';
import { formatDateOnly } from '@/lib/date-utils';
import { getNivelRiscoColor } from '@/lib/text-utils';
import { differenceInDays } from 'date-fns';
import { AceiteDetalheDialog } from '@/components/riscos/AceiteDetalheDialog';

interface RiscoAceito {
  id: string;
  nome: string;
  nivel_risco_inicial: string;
  nivel_risco_residual?: string;
  justificativa_aceite?: string;
  data_aceite?: string;
  aprovador_aceite?: string;
  data_proxima_revisao?: string;
  responsavel?: string;
  created_at: string;
  aprovador_nome?: string;
  responsavel_nome?: string;
}

export default function RiscosAceite() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [revisaoFilter, setRevisaoFilter] = useState('');
  const [nivelFilter, setNivelFilter] = useState('');
  const [selectedRisco, setSelectedRisco] = useState<RiscoAceito | null>(null);
  const [detalheOpen, setDetalheOpen] = useState(false);

  const { data: riscos = [], isLoading } = useQuery({
    queryKey: ['riscos-aceitos', profile?.empresa_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('riscos')
        .select(`
          id, nome, nivel_risco_inicial, nivel_risco_residual,
          justificativa_aceite, data_aceite, aprovador_aceite,
          data_proxima_revisao, responsavel, created_at
        `)
        .eq('empresa_id', profile!.empresa_id)
        .eq('aceito', true)
        .order('data_aceite', { ascending: false });

      if (error) throw error;

      // Buscar nomes dos aprovadores e responsáveis
      const userIds = new Set<string>();
      data?.forEach(r => {
        if (r.aprovador_aceite) userIds.add(r.aprovador_aceite);
        if (r.responsavel) userIds.add(r.responsavel);
      });

      let profileMap = new Map<string, string>();
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', Array.from(userIds));
        profiles?.forEach(p => profileMap.set(p.user_id, p.nome));
      }

      return (data || []).map(r => ({
        ...r,
        aprovador_nome: r.aprovador_aceite ? profileMap.get(r.aprovador_aceite) || null : null,
        responsavel_nome: r.responsavel ? profileMap.get(r.responsavel) || null : null,
      }));
    },
    enabled: !!profile?.empresa_id,
  });

  const getRevisaoStatus = (dataRevisao?: string): 'vencida' | 'proxima' | 'ok' | 'sem_data' => {
    if (!dataRevisao) return 'sem_data';
    const dias = differenceInDays(new Date(dataRevisao), new Date());
    if (dias < 0) return 'vencida';
    if (dias <= 7) return 'proxima';
    return 'ok';
  };

  const filteredRiscos = riscos.filter(r => {
    const matchesSearch = r.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNivel = !nivelFilter || nivelFilter === 'all' || r.nivel_risco_inicial === nivelFilter;
    const matchesRevisao = !revisaoFilter || revisaoFilter === 'all' || getRevisaoStatus(r.data_proxima_revisao) === revisaoFilter;
    return matchesSearch && matchesNivel && matchesRevisao;
  });

  const totalAceitos = riscos.length;
  const revisoesVencidas = riscos.filter(r => getRevisaoStatus(r.data_proxima_revisao) === 'vencida').length;
  const revisoesProximas = riscos.filter(r => getRevisaoStatus(r.data_proxima_revisao) === 'proxima').length;
  const semDataRevisao = riscos.filter(r => getRevisaoStatus(r.data_proxima_revisao) === 'sem_data').length;

  const handleRevogarAceite = async (risco: RiscoAceito) => {
    try {
      const { error } = await supabase
        .from('riscos')
        .update({ aceito: false, justificativa_aceite: null, data_aceite: null, aprovador_aceite: null })
        .eq('id', risco.id);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Aceite de risco revogado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ['riscos-aceitos'] });
      queryClient.invalidateQueries({ queryKey: ['riscos'] });
      queryClient.invalidateQueries({ queryKey: ['riscos-stats'] });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleAgendarRevisao = async (risco: RiscoAceito, dias: number) => {
    const novaData = new Date();
    novaData.setDate(novaData.getDate() + dias);
    
    try {
      const { error } = await supabase
        .from('riscos')
        .update({ data_proxima_revisao: novaData.toISOString().split('T')[0] })
        .eq('id', risco.id);

      if (error) throw error;

      toast({ title: "Sucesso", description: `Revisão agendada para ${formatDateOnly(novaData.toISOString())}` });
      queryClient.invalidateQueries({ queryKey: ['riscos-aceitos'] });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const getRevisaoBadge = (dataRevisao?: string) => {
    const status = getRevisaoStatus(dataRevisao);
    switch (status) {
      case 'vencida': return <Badge className="bg-red-100 text-red-800 border-red-200">Vencida</Badge>;
      case 'proxima': {
        const dias = differenceInDays(new Date(dataRevisao!), new Date());
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{dias}d restantes</Badge>;
      }
      case 'ok': return <Badge className="bg-green-100 text-green-800 border-green-200">Em dia</Badge>;
      case 'sem_data': return <Badge variant="outline" className="text-muted-foreground">Sem data</Badge>;
    }
  };

  const columns: Array<Column<RiscoAceito>> = [
    {
      key: 'nome',
      label: 'Risco',
      sortable: true,
      render: (value: any) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'nivel_risco_inicial',
      label: 'Nível',
      render: (value: string) => <Badge className={`${getNivelRiscoColor(value)} border whitespace-nowrap`}>{value}</Badge>,
    },
    {
      key: 'justificativa_aceite',
      label: 'Justificativa',
      render: (value: string) => value ? (
        <span className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]">{value}</span>
      ) : '-',
    },
    {
      key: 'data_aceite',
      label: 'Data Aceite',
      sortable: true,
      render: (value: string) => value ? formatDateOnly(value) : '-',
    },
    {
      key: 'aprovador_nome',
      label: 'Aprovador',
      render: (value: string) => value || '-',
    },
    {
      key: 'data_proxima_revisao',
      label: 'Revisão',
      sortable: true,
      render: (value: string, risco: RiscoAceito) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm">{value ? formatDateOnly(value) : '-'}</span>
          {getRevisaoBadge(value)}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Ações',
      className: 'w-[60px]',
      render: (_: any, risco: RiscoAceito) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setSelectedRisco(risco); setDetalheOpen(true); }}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAgendarRevisao(risco, 30)}>
              <CalendarClock className="mr-2 h-4 w-4" />
              Agendar Revisão (30d)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAgendarRevisao(risco, 90)}>
              <CalendarClock className="mr-2 h-4 w-4" />
              Agendar Revisão (90d)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRevogarAceite(risco)} className="text-destructive focus:text-destructive">
              <XCircle className="mr-2 h-4 w-4" />
              Revogar Aceite
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filters = [
    {
      key: 'revisao',
      label: 'Status Revisão',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'vencida', label: 'Vencida' },
        { value: 'proxima', label: 'Próxima (7d)' },
        { value: 'ok', label: 'Em dia' },
        { value: 'sem_data', label: 'Sem data' },
      ],
      value: revisaoFilter,
      onChange: (value: string) => setRevisaoFilter(value === 'all' ? '' : value),
    },
    {
      key: 'nivel',
      label: 'Nível',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'Crítico', label: 'Crítico' },
        { value: 'Muito Alto', label: 'Muito Alto' },
        { value: 'Alto', label: 'Alto' },
        { value: 'Médio', label: 'Médio' },
        { value: 'Baixo', label: 'Baixo' },
      ],
      value: nivelFilter,
      onChange: (value: string) => setNivelFilter(value === 'all' ? '' : value),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-4 w-24 mb-3" /><Skeleton className="h-8 w-16" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aceite de Risco"
        description="Gerencie riscos aceitos formalmente, suas revisões e fluxo de aprovação"
        backTo="/riscos"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Riscos Aceitos"
          value={totalAceitos}
          description="Total de riscos aceitos"
          icon={<CheckCircle className="h-4 w-4" />}
          variant="default"
        />
        <StatCard
          title="Revisões Vencidas"
          value={revisoesVencidas}
          description="Precisam de atenção imediata"
          icon={<CalendarX className="h-4 w-4" />}
          variant={revisoesVencidas > 0 ? "destructive" : "default"}
        />
        <StatCard
          title="Revisões Próximas"
          value={revisoesProximas}
          description="Nos próximos 7 dias"
          icon={<Clock className="h-4 w-4" />}
          variant={revisoesProximas > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Sem Data de Revisão"
          value={semDataRevisao}
          description="Sem revisão agendada"
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={semDataRevisao > 0 ? "warning" : "default"}
        />
      </div>

      <Card className="rounded-lg border overflow-hidden">
        <CardContent className="p-0">
          <DataTable
            data={filteredRiscos}
            columns={columns}
            loading={isLoading}
            searchable
            searchPlaceholder="Buscar riscos aceitos..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            emptyState={{
              icon: <CheckCircle className="h-8 w-8" />,
              title: 'Nenhum risco aceito',
              description: 'Riscos aceitos formalmente aparecerão aqui.',
            }}
          />
        </CardContent>
      </Card>

      {selectedRisco && (
        <AceiteDetalheDialog
          open={detalheOpen}
          onOpenChange={setDetalheOpen}
          risco={selectedRisco}
        />
      )}
    </div>
  );
}
