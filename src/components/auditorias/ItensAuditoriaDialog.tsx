import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, FileText, MessageSquare, Paperclip, User, Calendar, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { ItemAuditoriaFormDialog } from "./ItemAuditoriaFormDialog";
import { ItemAuditoriaDetalheDialog } from "./ItemAuditoriaDetalheDialog";
import { useUsuariosEmpresa } from "@/hooks/useAuditoriaData";
import { formatDateOnly } from "@/lib/date-utils";

interface ItensAuditoriaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditoriaId: string;
  auditoriaNome: string;
}

const statusOptions = [
  { value: "pendente", label: "Pendente", color: "bg-gray-100 text-gray-800" },
  { value: "em_andamento", label: "Em Andamento", color: "bg-blue-100 text-blue-800" },
  { value: "concluido", label: "Concluído", color: "bg-green-100 text-green-800" },
  { value: "nao_aplicavel", label: "Não Aplicável", color: "bg-slate-100 text-slate-600" },
];

const prioridadeOptions = [
  { value: "alta", label: "Alta", color: "bg-red-100 text-red-800" },
  { value: "media", label: "Média", color: "bg-yellow-100 text-yellow-800" },
  { value: "baixa", label: "Baixa", color: "bg-green-100 text-green-800" },
];

export function ItensAuditoriaDialog({
  open,
  onOpenChange,
  auditoriaId,
  auditoriaNome,
}: ItensAuditoriaDialogProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [responsavelFilter, setResponsavelFilter] = useState<string>("todos");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetalheOpen, setIsDetalheOpen] = useState(false);
  const [detalheItem, setDetalheItem] = useState<any>(null);

  const { data: usuarios } = useUsuariosEmpresa();

  const { data: itens, isLoading } = useQuery({
    queryKey: ["auditoria-itens", auditoriaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auditoria_itens")
        .select(`
          *,
          responsavel:profiles!auditoria_itens_responsavel_id_fkey(user_id, nome, email)
        `)
        .eq("auditoria_id", auditoriaId)
        .order("codigo");

      if (error) throw error;
      return data || [];
    },
    enabled: open && !!auditoriaId,
  });

  // Buscar contagens de evidências e comentários para cada item
  const { data: contagens } = useQuery({
    queryKey: ["auditoria-itens-contagens", auditoriaId],
    queryFn: async () => {
      if (!itens || itens.length === 0) return {};

      const itemIds = itens.map((i) => i.id);

      const [evidenciasRes, comentariosRes] = await Promise.all([
        supabase
          .from("auditoria_itens_evidencias")
          .select("item_id")
          .in("item_id", itemIds),
        supabase
          .from("auditoria_itens_comentarios")
          .select("item_id")
          .in("item_id", itemIds),
      ]);

      const evidenciasPorItem: Record<string, number> = {};
      const comentariosPorItem: Record<string, number> = {};

      evidenciasRes.data?.forEach((e) => {
        evidenciasPorItem[e.item_id] = (evidenciasPorItem[e.item_id] || 0) + 1;
      });

      comentariosRes.data?.forEach((c) => {
        comentariosPorItem[c.item_id] = (comentariosPorItem[c.item_id] || 0) + 1;
      });

      return { evidencias: evidenciasPorItem, comentarios: comentariosPorItem };
    },
    enabled: !!itens && itens.length > 0,
  });

  const filteredItens = itens?.filter((item) => {
    const matchesSearch =
      item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || item.status === statusFilter;
    const matchesResponsavel =
      responsavelFilter === "todos" || item.responsavel_id === responsavelFilter;
    return matchesSearch && matchesStatus && matchesResponsavel;
  });

  const stats = {
    total: itens?.length || 0,
    pendente: itens?.filter((i) => i.status === "pendente").length || 0,
    em_andamento: itens?.filter((i) => i.status === "em_andamento").length || 0,
    concluido: itens?.filter((i) => i.status === "concluido").length || 0,
  };

  const progressPercent = stats.total > 0 ? Math.round((stats.concluido / stats.total) * 100) : 0;

  const handleAddItem = () => {
    setSelectedItem(null);
    setIsFormOpen(true);
  };

  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  const handleOpenDetalhe = (item: any) => {
    setDetalheItem(item);
    setIsDetalheOpen(true);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["auditoria-itens", auditoriaId] });
    queryClient.invalidateQueries({ queryKey: ["auditoria-itens-count", auditoriaId] });
    setIsFormOpen(false);
  };

  const handleDetalheSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["auditoria-itens", auditoriaId] });
    queryClient.invalidateQueries({ queryKey: ["auditoria-itens-contagens", auditoriaId] });
  };

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find((o) => o.value === status);
    return (
      <Badge className={`${option?.color || ""} border-0`}>
        {option?.label || status}
      </Badge>
    );
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const option = prioridadeOptions.find((o) => o.value === prioridade);
    return (
      <Badge variant="outline" className={option?.color || ""}>
        {option?.label || prioridade}
      </Badge>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Itens de Verificação - {auditoriaNome}
            </DialogTitle>
          </DialogHeader>

          {/* Progresso */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso da Auditoria</span>
              <span className="font-medium">{progressPercent}% concluído</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Total: {stats.total}</span>
              <span className="text-gray-600">Pendente: {stats.pendente}</span>
              <span className="text-blue-600">Em Andamento: {stats.em_andamento}</span>
              <span className="text-green-600">Concluído: {stats.concluido}</span>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código ou título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                {statusOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Responsáveis</SelectItem>
                {usuarios?.map((u) => (
                  <SelectItem key={u.user_id} value={u.user_id}>
                    {u.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Item
            </Button>
          </div>

          {/* Tabela */}
          <div className="flex-1 overflow-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Código</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead className="w-[150px]">Responsável</TableHead>
                  <TableHead className="w-[100px]">Prazo</TableHead>
                  <TableHead className="w-[100px]">Prioridade</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[80px] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredItens?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum item encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItens?.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleOpenDetalhe(item)}
                    >
                      <TableCell className="font-mono text-sm">{item.codigo}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.titulo}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Paperclip className="h-3 w-3" />
                              {contagens?.evidencias?.[item.id] || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {contagens?.comentarios?.[item.id] || 0}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.responsavel ? (
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm truncate max-w-[120px]">
                              {item.responsavel.nome}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.prazo ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDateOnly(item.prazo)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getPrioridadeBadge(item.prioridade)}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-center">
                        <ChevronRight className="h-4 w-4 text-muted-foreground mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <ItemAuditoriaFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        auditoriaId={auditoriaId}
        auditoriaNome={auditoriaNome}
        item={selectedItem}
        onSuccess={handleFormSuccess}
      />

      <ItemAuditoriaDetalheDialog
        open={isDetalheOpen}
        onOpenChange={setIsDetalheOpen}
        item={detalheItem}
        onSuccess={handleDetalheSuccess}
        onEdit={() => {
          setIsDetalheOpen(false);
          handleEditItem(detalheItem);
        }}
      />
    </>
  );
}
