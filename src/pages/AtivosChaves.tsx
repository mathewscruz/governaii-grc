import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Plus, KeyRound, AlertCircle, Clock, ShieldAlert } from "lucide-react";
import { ChaveDialog } from "@/components/ativos/ChaveDialog";
import { useChavesStats } from "@/hooks/useChavesStats";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AtivosChaves() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedChave, setSelectedChave] = useState<any>(null);
  
  const { data: stats, isLoading: statsLoading } = useChavesStats();
  
  const { data: chaves, isLoading } = useQuery({
    queryKey: ['ativos-chaves'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ativos_chaves_criptograficas')
        .select('*')
        .order('data_proxima_rotacao', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const handleEdit = (chave: any) => {
    setSelectedChave(chave);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedChave(null);
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      ativa: "default",
      expirada: "destructive",
      revogada: "secondary",
      em_rotacao: "outline"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getCriticidadeBadge = (criticidade: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      critica: "destructive",
      alta: "destructive",
      media: "default",
      baixa: "secondary"
    };
    return <Badge variant={variants[criticidade] || "default"}>{criticidade}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Chaves Criptográficas"
        description="Gestão e rotação de chaves criptográficas"
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total de Chaves"
          value={stats?.total || 0}
          icon={<KeyRound className="h-4 w-4" />}
          loading={statsLoading}
        />
        <StatCard
          title="Rotação em 30 dias"
          value={stats?.rotacao30dias || 0}
          icon={<Clock className="h-4 w-4" />}
          loading={statsLoading}
          variant={stats?.rotacao30dias ? "warning" : "default"}
        />
        <StatCard
          title="Expiradas"
          value={stats?.expiradas || 0}
          icon={<AlertCircle className="h-4 w-4" />}
          loading={statsLoading}
          variant={stats?.expiradas ? "destructive" : "default"}
        />
        <StatCard
          title="Críticas Ativas"
          value={stats?.criticas || 0}
          icon={<ShieldAlert className="h-4 w-4" />}
          loading={statsLoading}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Chave
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Ambiente</TableHead>
              <TableHead>Sistema</TableHead>
              <TableHead>Última Rotação</TableHead>
              <TableHead>Próxima Rotação</TableHead>
              <TableHead>Criticidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : chaves?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Nenhuma chave cadastrada
                </TableCell>
              </TableRow>
            ) : (
              chaves?.map((chave) => (
                <TableRow key={chave.id}>
                  <TableCell className="font-medium">{chave.nome}</TableCell>
                  <TableCell>{chave.tipo_chave}</TableCell>
                  <TableCell><Badge>{chave.ambiente}</Badge></TableCell>
                  <TableCell>{chave.sistema_aplicacao || '-'}</TableCell>
                  <TableCell>
                    {chave.data_ultima_rotacao 
                      ? format(new Date(chave.data_ultima_rotacao), 'dd/MM/yyyy')
                      : 'Nunca'}
                  </TableCell>
                  <TableCell>
                    {chave.data_proxima_rotacao 
                      ? format(new Date(chave.data_proxima_rotacao), 'dd/MM/yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>{getCriticidadeBadge(chave.criticidade)}</TableCell>
                  <TableCell>{getStatusBadge(chave.status)}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEdit(chave)}
                    >
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ChaveDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        chave={selectedChave}
      />
    </div>
  );
}
