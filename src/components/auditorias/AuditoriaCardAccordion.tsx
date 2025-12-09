import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Edit, 
  Trash2,
  Calendar,
  User,
  ClipboardCheck
} from "lucide-react";
import { formatStatus } from "@/lib/text-utils";

interface AuditoriaCardAccordionProps {
  auditoria: any;
  counts: { itens: number; itensConcluidos: number };
  onEdit: () => void;
  onDelete: () => void;
  onOpenControles: () => void;
  auditorNome?: string;
}

const getStatusBadgeVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
  switch (status) {
    case 'planejamento': return 'outline';
    case 'em_andamento': return 'default';
    case 'concluida': return 'secondary';
    case 'cancelada': return 'destructive';
    default: return 'secondary';
  }
};

const getStatusCustomClass = (status: string) => {
  if (status === 'concluida') return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
  return '';
};

const getPrioridadeBadgeVariant = (prioridade: string): "default" | "destructive" | "secondary" | "outline" => {
  switch (prioridade) {
    case 'critica': return 'destructive';
    case 'alta': return 'default';
    case 'media': return 'secondary';
    case 'baixa': return 'outline';
    default: return 'secondary';
  }
};

const getPrioridadeCustomClass = (prioridade: string) => {
  switch (prioridade) {
    case 'critica': return 'bg-red-600 text-white border-red-700 hover:bg-red-700';
    case 'alta': return 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200';
    default: return '';
  }
};

export function AuditoriaCardAccordion({
  auditoria,
  counts,
  onEdit,
  onDelete,
  onOpenControles,
  auditorNome
}: AuditoriaCardAccordionProps) {
  const progressPercent = counts.itens > 0 ? Math.round((counts.itensConcluidos / counts.itens) * 100) : 0;

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-3">
        {/* Linha principal */}
        <div className="flex items-center justify-between gap-3">
          {/* Nome */}
          <div className="flex items-center gap-2 min-w-0 flex-shrink-0" style={{ width: '200px' }}>
            <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="font-medium text-sm truncate">{auditoria.nome}</span>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-1 flex-wrap">
            <Badge variant="outline" className="text-[11px] py-0 h-5 px-2 whitespace-nowrap">
              {formatStatus(auditoria.tipo)}
            </Badge>
            <Badge 
              variant={getStatusBadgeVariant(auditoria.status)}
              className={`text-[11px] py-0 h-5 px-2 whitespace-nowrap ${getStatusCustomClass(auditoria.status)}`}
            >
              {formatStatus(auditoria.status)}
            </Badge>
            <Badge 
              variant={getPrioridadeBadgeVariant(auditoria.prioridade)}
              className={`text-[11px] py-0 h-5 px-2 whitespace-nowrap ${getPrioridadeCustomClass(auditoria.prioridade)}`}
            >
              {formatStatus(auditoria.prioridade)}
            </Badge>
            
            {/* Botão Controles com progresso */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenControles}
              className="h-6 px-2 text-[11px] gap-1.5"
            >
              <ClipboardCheck className="h-3 w-3" />
              <span>Controles</span>
              <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-1">
                {counts.itensConcluidos}/{counts.itens}
              </Badge>
            </Button>

            {/* Barra de progresso compacta */}
            {counts.itens > 0 && (
              <div className="flex items-center gap-1.5 min-w-[80px]">
                <Progress value={progressPercent} className="h-1.5 flex-1" />
                <span className="text-[10px] text-muted-foreground">{progressPercent}%</span>
              </div>
            )}

            {/* Data e Auditor */}
            {auditoria.data_inicio && (
              <Badge variant="outline" className="text-[11px] py-0 h-5 px-2">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(auditoria.data_inicio).toLocaleDateString('pt-BR')}
              </Badge>
            )}
            {auditorNome && (
              <Badge variant="outline" className="text-[11px] py-0 h-5 px-2">
                <User className="h-3 w-3 mr-1" />
                <span className="max-w-[100px] truncate">{auditorNome}</span>
              </Badge>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onEdit} 
              className="h-7 w-7 p-0"
              title="Editar"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDelete} 
              className="h-7 w-7 p-0"
              title="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Descrição se houver */}
        {auditoria.descricao && (
          <p className="text-[11px] text-muted-foreground mt-2 line-clamp-1">
            {auditoria.descricao}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
