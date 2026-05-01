import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Download, Search, FileText, CheckCircle2, XCircle, MinusCircle, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { toast } from 'sonner';
import { exportSoAPDF } from './SoAExportPDF';

interface SoAItem {
  id: string;
  codigo: string;
  titulo: string;
  categoria: string;
  aplicavel: boolean;
  justificativa: string;
  conformity_status: string;
  responsavel: string | null;
  evidencias_count: number;
}

interface SoATabProps {
  frameworkId: string;
  frameworkName: string;
  frameworkVersion: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  conforme: { label: 'Conforme', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  parcial: { label: 'Parcial', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: MinusCircle },
  nao_conforme: { label: 'Não Conforme', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  nao_aplicavel: { label: 'N/A', color: 'bg-muted text-muted-foreground', icon: MinusCircle },
  nao_avaliado: { label: 'Não Avaliado', color: 'bg-muted text-muted-foreground', icon: HelpCircle },
};

export function SoATab({ frameworkId, frameworkName, frameworkVersion }: SoATabProps) {
  const { empresaId } = useEmpresaId();
  const [items, setItems] = useState<SoAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterApplicability, setFilterApplicability] = useState('todos');
  const [justificativas, setJustificativas] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!frameworkId || !empresaId) return;
    loadSoAData();
  }, [frameworkId, empresaId]);

  const loadSoAData = async () => {
    if (!empresaId) return;
    setLoading(true);
    try {
      const [reqsRes, evalsRes] = await Promise.all([
        supabase
          .from('gap_analysis_requirements')
          .select('id, codigo, titulo, categoria, area_responsavel')
          .eq('framework_id', frameworkId)
          .order('ordem', { ascending: true }),
        supabase
          .from('gap_analysis_evaluations')
          .select('requirement_id, conformity_status, observacoes')
          .eq('framework_id', frameworkId)
          .eq('empresa_id', empresaId),
      ]);

      const reqs = reqsRes.data || [];
      const evals = evalsRes.data || [];

      const evalMap = new Map(evals.map(e => [e.requirement_id, e]));

      // Also load existing justificativas from gap_analysis_soa if table exists
      let soaMap = new Map<string, { aplicavel: boolean; justificativa: string }>();
      try {
        const { data: soaData } = await supabase
          .from('gap_analysis_soa')
          .select('requirement_id, aplicavel, justificativa')
          .eq('framework_id', frameworkId)
          .eq('empresa_id', empresaId);
        if (soaData) {
          (soaData as any[]).forEach((s: any) => {
            soaMap.set(s.requirement_id, { aplicavel: s.aplicavel, justificativa: s.justificativa || '' });
          });
        }
      } catch {
        // Table may not exist yet, items default to applicable
      }

      const soaItems: SoAItem[] = reqs.map(r => {
        const evalData = evalMap.get(r.id);
        const soaEntry = soaMap.get(r.id);
        const status = evalData?.conformity_status || 'nao_avaliado';
        const isNA = status === 'nao_aplicavel';

        return {
          id: r.id,
          codigo: r.codigo || '',
          titulo: r.titulo,
          categoria: r.categoria || 'Outros',
          aplicavel: soaEntry ? soaEntry.aplicavel : !isNA,
          justificativa: soaEntry?.justificativa || (isNA ? (evalData?.observacoes || '') : ''),
          conformity_status: status,
          responsavel: r.area_responsavel,
          evidencias_count: 0,
        };
      });

      setItems(soaItems);
      const justMap: Record<string, string> = {};
      soaItems.forEach(item => { justMap[item.id] = item.justificativa; });
      setJustificativas(justMap);
    } catch {
      toast.error('Erro ao carregar dados da SoA');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (search) {
        const s = search.toLowerCase();
        if (!item.codigo.toLowerCase().includes(s) && !item.titulo.toLowerCase().includes(s)) return false;
      }
      if (filterStatus !== 'todos' && item.conformity_status !== filterStatus) return false;
      if (filterApplicability === 'aplicavel' && !item.aplicavel) return false;
      if (filterApplicability === 'nao_aplicavel' && item.aplicavel) return false;
      return true;
    });
  }, [items, search, filterStatus, filterApplicability]);

  const stats = useMemo(() => {
    const total = items.length;
    const aplicavel = items.filter(i => i.aplicavel).length;
    const naoAplicavel = total - aplicavel;
    const conforme = items.filter(i => i.aplicavel && i.conformity_status === 'conforme').length;
    const parcial = items.filter(i => i.aplicavel && i.conformity_status === 'parcial').length;
    const naoConforme = items.filter(i => i.aplicavel && i.conformity_status === 'nao_conforme').length;
    const naoAvaliado = items.filter(i => i.aplicavel && i.conformity_status === 'nao_avaliado').length;
    return { total, aplicavel, naoAplicavel, conforme, parcial, naoConforme, naoAvaliado };
  }, [items]);

  const toggleApplicability = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, aplicavel: !item.aplicavel } : item
    ));
  };

  const updateJustificativa = (id: string, value: string) => {
    setJustificativas(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    if (!empresaId) return;
    setSaving(true);
    try {
      // Save SoA data - upsert into gap_analysis_soa table
      const records = items.map(item => ({
        framework_id: frameworkId,
        empresa_id: empresaId,
        requirement_id: item.id,
        aplicavel: item.aplicavel,
        justificativa: justificativas[item.id] || '',
      }));

      // Use upsert - try table, if doesn't exist show message
      const { error } = await supabase
        .from('gap_analysis_soa')
        .upsert(records, { onConflict: 'framework_id,empresa_id,requirement_id' });

      if (error) throw error;
      toast.success('Declaração de Aplicabilidade salva com sucesso');
    } catch {
      toast.error('Erro ao salvar SoA. A tabela pode ainda não existir.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { data: empresa } = await supabase
        .from('empresas')
        .select('nome')
        .eq('id', empresaId)
        .single();

      await exportSoAPDF({
        frameworkName,
        frameworkVersion,
        empresaNome: empresa?.nome || 'Empresa',
        items: items.map(item => ({
          ...item,
          justificativa: justificativas[item.id] || item.justificativa,
        })),
        stats,
      });
      toast.success('PDF da SoA exportado com sucesso');
    } catch {
      toast.error('Erro ao exportar PDF');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[280px] flex flex-col items-center justify-center gap-3">
        <AkurisPulse size={56} />
        <p className="text-sm text-muted-foreground">Carregando SoA...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Aplicáveis</p>
          <p className="text-2xl font-bold text-primary">{stats.aplicavel}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Não Aplicáveis</p>
          <p className="text-2xl font-bold text-muted-foreground">{stats.naoAplicavel}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-chart-2">Conformes</p>
          <p className="text-2xl font-bold text-chart-2">{stats.conforme}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-chart-4">Parciais</p>
          <p className="text-2xl font-bold text-chart-4">{stats.parcial}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-destructive">Não Conformes</p>
          <p className="text-2xl font-bold text-destructive">{stats.naoConforme}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Não Avaliados</p>
          <p className="text-2xl font-bold text-muted-foreground">{stats.naoAvaliado}</p>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5}/>
          <Input
            placeholder="Buscar por código ou título..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="conforme">Conforme</SelectItem>
            <SelectItem value="parcial">Parcial</SelectItem>
            <SelectItem value="nao_conforme">Não Conforme</SelectItem>
            <SelectItem value="nao_avaliado">Não Avaliado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterApplicability} onValueChange={setFilterApplicability}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Aplicável + N/A</SelectItem>
            <SelectItem value="aplicavel">Apenas Aplicáveis</SelectItem>
            <SelectItem value="nao_aplicavel">Apenas N/A</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar SoA'}
          </Button>
          <Button onClick={handleExportPDF} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" strokeWidth={1.5}/>
            {exporting ? 'Exportando...' : 'Exportar PDF'}
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-primary" strokeWidth={1.5}/>
            Declaração de Aplicabilidade (SoA)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Código</TableHead>
                  <TableHead>Requisito</TableHead>
                  <TableHead className="w-28">Aplicável</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-32">Responsável</TableHead>
                  <TableHead className="w-20 text-center">Evid.</TableHead>
                  <TableHead className="min-w-[200px]">Justificativa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map(item => {
                  const statusCfg = STATUS_CONFIG[item.conformity_status] || STATUS_CONFIG.nao_avaliado;
                  const StatusIcon = statusCfg.icon;
                  return (
                    <TableRow key={item.id} className={!item.aplicavel ? 'opacity-60' : ''}>
                      <TableCell className="font-mono text-xs">{item.codigo}</TableCell>
                      <TableCell className="text-sm max-w-xs truncate" title={item.titulo}>
                        {item.titulo}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={item.aplicavel ? 'default' : 'outline'}
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => toggleApplicability(item.id)}
                        >
                          {item.aplicavel ? 'Sim' : 'Não'}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${statusCfg.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" strokeWidth={1.5}/>
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.responsavel || '—'}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {item.evidencias_count > 0 ? (
                          <Badge variant="secondary" className="text-xs">{item.evidencias_count}</Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Textarea
                          placeholder={!item.aplicavel ? 'Justificativa para exclusão...' : 'Observações...'}
                          value={justificativas[item.id] || ''}
                          onChange={e => updateJustificativa(item.id, e.target.value)}
                          rows={1}
                          className="text-xs min-h-[32px] resize-none"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum requisito encontrado com os filtros selecionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
