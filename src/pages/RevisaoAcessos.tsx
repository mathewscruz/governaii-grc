import { useState } from "react";
import { Plus, RefreshCw, Download, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable, Column } from "@/components/ui/data-table";
import { useReviewStats } from "@/hooks/useReviewStats";
import { useReviewData } from "@/hooks/useReviewData";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ReviewDialog } from "@/components/revisao-acessos/ReviewDialog";
import { ReviewItemsDialog } from "@/components/revisao-acessos/ReviewItemsDialog";
import { formatDateForInput } from "@/lib/date-utils";
import { formatStatus } from "@/lib/text-utils";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";

export default function RevisaoAcessos() {
  const { empresaId } = useEmpresaId();
  const { data: stats, loading: statsLoading } = useReviewStats();
  const { deleteReview } = useReviewData();
  const { toast } = useToast();
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: "asc" | "desc" } | null>(null);

  const {
    data: reviews,
    loading: reviewsLoading,
    refetch,
  } = useOptimizedQuery(
    async () => {
      if (!empresaId) return { data: [], error: null };

      let query = supabase
        .from("access_reviews")
        .select(`
          *,
          sistema:sistemas_privilegiados(nome_sistema),
          responsavel:responsavel_revisao(nome),
          creator:created_by(nome)
        `)
        .eq("empresa_id", empresaId);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      return { data: data || [], error };
    },
    [empresaId, statusFilter],
    { cacheKey: `reviews-${empresaId}-${statusFilter}` }
  );

  const handleEdit = (review: any) => {
    setSelectedReview(review);
    setReviewDialogOpen(true);
  };

  const handleViewItems = (review: any) => {
    setSelectedReview(review);
    setItemsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteReview(deleteConfirm);
    setDeleteConfirm(null);
    refetch();
  };

  const handleSort = (field: string) => {
    setSortConfig((current) => {
      if (current?.field === field) {
        return current.direction === "asc" ? { field, direction: "desc" } : null;
      }
      return { field, direction: "asc" };
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      rascunho: "outline",
      em_andamento: "default",
      concluida: "secondary",
      cancelada: "destructive",
    };
    return (
      <Badge variant={variants[status] || "default"} className="whitespace-nowrap">
        {formatStatus(status)}
      </Badge>
    );
  };

  const filteredAndSortedReviews = reviews
    ?.filter((review) =>
      searchTerm
        ? review.nome_revisao.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.sistema?.nome_sistema.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    )
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const aVal = a[sortConfig.field];
      const bVal = b[sortConfig.field];
      const direction = sortConfig.direction === "asc" ? 1 : -1;
      return aVal > bVal ? direction : -direction;
    });

  const columns: Column<any>[] = [
    {
      key: "nome_revisao",
      label: "Nome da Revisão",
      sortable: true,
    },
    {
      key: "sistema.nome_sistema",
      label: "Sistema",
      sortable: true,
      render: (review) => review.sistema?.nome_sistema || "-",
    },
    {
      key: "tipo_revisao",
      label: "Tipo",
      sortable: true,
      render: (review) => formatStatus(review.tipo_revisao),
    },
    {
      key: "responsavel.nome",
      label: "Responsável",
      sortable: true,
      render: (review) => review.responsavel?.nome || "-",
    },
    {
      key: "data_limite",
      label: "Prazo",
      sortable: true,
      render: (review) => formatDateForInput(review.data_limite),
    },
    {
      key: "progress",
      label: "Progresso",
      render: (review) => `${review.contas_revisadas}/${review.total_contas}`,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (review) => getStatusBadge(review.status),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Revisão de Acessos</h1>
        <p className="text-muted-foreground">
          Gerencie revisões periódicas de acessos privilegiados
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Em Andamento"
          value={stats?.emAndamento || 0}
          loading={statsLoading}
        />
        <StatCard
          title="Concluídas"
          value={stats?.concluidas || 0}
          loading={statsLoading}
        />
        <StatCard
          title="Vencidas"
          value={stats?.vencidas || 0}
          loading={statsLoading}
          variant="destructive"
        />
        <StatCard
          title="Contas Revisadas"
          value={stats?.contasRevisadas || 0}
          loading={statsLoading}
        />
      </div>

      <Card className="p-6">
        <Tabs defaultValue="ativas">
          <TabsList>
            <TabsTrigger value="ativas">Revisões Ativas</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="ativas" className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={() => {
                setSelectedReview(null);
                setReviewDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Revisão
              </Button>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>

            <DataTable
              data={filteredAndSortedReviews || []}
              columns={columns}
              loading={reviewsLoading}
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Buscar revisões..."
              filters={[
                {
                  key: "status",
                  label: "Status",
                  options: [
                    { value: "all", label: "Todos" },
                    { value: "rascunho", label: "Rascunho" },
                    { value: "em_andamento", label: "Em Andamento" },
                    { value: "concluida", label: "Concluída" },
                    { value: "cancelada", label: "Cancelada" },
                  ],
                  value: statusFilter,
                  onChange: setStatusFilter,
                },
              ]}
              sortField={sortConfig?.field}
              sortDirection={sortConfig?.direction}
              onSort={handleSort}
            />
          </TabsContent>

          <TabsContent value="historico">
            <p className="text-muted-foreground">Histórico de revisões concluídas</p>
          </TabsContent>
        </Tabs>
      </Card>

      <ReviewDialog
        open={reviewDialogOpen}
        onClose={() => {
          setReviewDialogOpen(false);
          setSelectedReview(null);
        }}
        review={selectedReview}
        onSuccess={() => {
          refetch();
          setReviewDialogOpen(false);
          setSelectedReview(null);
        }}
      />

      <ReviewItemsDialog
        open={itemsDialogOpen}
        onClose={() => {
          setItemsDialogOpen(false);
          setSelectedReview(null);
        }}
        review={selectedReview}
        onSuccess={() => {
          refetch();
        }}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Excluir Revisão"
        description="Tem certeza que deseja excluir esta revisão? Esta ação não pode ser desfeita."
        variant="destructive"
      />
    </div>
  );
}
