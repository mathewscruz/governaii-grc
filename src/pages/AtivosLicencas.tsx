import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Plus, FileKey, AlertCircle, Clock, DollarSign } from "lucide-react";
import { LicencaDialog } from "@/components/ativos/LicencaDialog";
import { useLicencasStats } from "@/hooks/useLicencasStats";
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

export default function AtivosLicencas() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLicenca, setSelectedLicenca] = useState<any>(null);
  
  const { data: stats, isLoading: statsLoading } = useLicencasStats();
  
  const { data: licencas, isLoading } = useQuery({
    queryKey: ['ativos-licencas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ativos_licencas')
        .select('*')
        .order('data_vencimento', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const handleEdit = (licenca: any) => {
    setSelectedLicenca(licenca);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedLicenca(null);
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      ativa: "default",
      vencida: "destructive",
      cancelada: "secondary",
      em_renovacao: "outline"
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
        title="Licenças"
        description="Gestão de licenças de software e serviços"
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total de Licenças"
          value={stats?.total || 0}
          icon={<FileKey className="h-4 w-4" />}
          loading={statsLoading}
        />
        <StatCard
          title="Vencendo em 30 dias"
          value={stats?.vencendo30dias || 0}
          icon={<Clock className="h-4 w-4" />}
          loading={statsLoading}
          variant={stats?.vencendo30dias ? "warning" : "default"}
        />
        <StatCard
          title="Vencidas"
          value={stats?.vencidas || 0}
          icon={<AlertCircle className="h-4 w-4" />}
          loading={statsLoading}
          variant={stats?.vencidas ? "destructive" : "default"}
        />
        <StatCard
          title="Custo Anual"
          value={`R$ ${(stats?.custoTotalAnual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<DollarSign className="h-4 w-4" />}
          loading={statsLoading}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Licença
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Data Vencimento</TableHead>
              <TableHead>Criticidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : licencas?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Nenhuma licença cadastrada
                </TableCell>
              </TableRow>
            ) : (
              licencas?.map((licenca) => (
                <TableRow key={licenca.id}>
                  <TableCell className="font-medium">{licenca.nome}</TableCell>
                  <TableCell>{licenca.tipo_licenca}</TableCell>
                  <TableCell>{licenca.fornecedor || '-'}</TableCell>
                  <TableCell>{licenca.quantidade_licencas}</TableCell>
                  <TableCell>
                    {licenca.data_vencimento 
                      ? format(new Date(licenca.data_vencimento), 'dd/MM/yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>{getCriticidadeBadge(licenca.criticidade)}</TableCell>
                  <TableCell>{getStatusBadge(licenca.status)}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEdit(licenca)}
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

      <LicencaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        licenca={selectedLicenca}
      />
    </div>
  );
}
