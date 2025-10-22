import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  FileText, 
  ClipboardList, 
  AlertTriangle, 
  FileCheck, 
  Image as ImageIcon,
  Edit, 
  Trash2,
  Calendar,
  User,
  ChevronDown,
  Plus
} from "lucide-react";
import { capitalizeText } from "@/lib/text-utils";

interface AuditoriaCardAccordionProps {
  auditoria: any;
  counts: { trabalhos: number; achados: number; recomendacoes: number };
  onEdit: () => void;
  onDelete: () => void;
  onOpenTrabalhos: () => void;
  onOpenAchados: () => void;
  onOpenRecomendacoes: () => void;
  onOpenEvidencias: () => void;
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
  onOpenTrabalhos,
  onOpenAchados,
  onOpenRecomendacoes,
  onOpenEvidencias,
  auditorNome
}: AuditoriaCardAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-3">
        {/* Linha principal - tudo horizontal */}
        <div className="flex items-center justify-between gap-3">
          {/* Nome */}
          <div className="flex items-center gap-2 min-w-0 flex-shrink-0" style={{ width: '200px' }}>
            <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="font-medium text-sm truncate">{auditoria.nome}</span>
          </div>

          {/* Badges - todos na mesma linha */}
          <div className="flex items-center gap-1.5 flex-1 flex-wrap">
            <Badge variant="outline" className="text-[11px] py-0 h-5 px-2">
              {capitalizeText(auditoria.tipo)}
            </Badge>
            <Badge 
              variant={getStatusBadgeVariant(auditoria.status)}
              className={`text-[11px] py-0 h-5 px-2 ${getStatusCustomClass(auditoria.status)}`}
            >
              {capitalizeText(auditoria.status.replace(/_/g, ' '))}
            </Badge>
            <Badge 
              variant={getPrioridadeBadgeVariant(auditoria.prioridade)}
              className={`text-[11px] py-0 h-5 px-2 ${getPrioridadeCustomClass(auditoria.prioridade)}`}
            >
              {capitalizeText(auditoria.prioridade)}
            </Badge>
            
            {/* Contadores clicáveis */}
            <Badge 
              variant="secondary" 
              className="cursor-pointer hover:bg-secondary/80 text-[11px] py-0 h-5 px-2"
              onClick={onOpenTrabalhos}
              title="Gerenciar Trabalhos"
            >
              <ClipboardList className="h-3 w-3 mr-1" />
              {counts.trabalhos}
            </Badge>
            <Badge 
              variant="secondary" 
              className="cursor-pointer hover:bg-secondary/80 text-[11px] py-0 h-5 px-2"
              onClick={onOpenAchados}
              title="Gerenciar Achados"
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              {counts.achados}
            </Badge>
            <Badge 
              variant="secondary" 
              className="cursor-pointer hover:bg-secondary/80 text-[11px] py-0 h-5 px-2"
              onClick={onOpenRecomendacoes}
              title="Gerenciar Recomendações"
            >
              <FileCheck className="h-3 w-3 mr-1" />
              {counts.recomendacoes}
            </Badge>

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

        {/* Accordion discreto para detalhes - SEMPRE visível */}
        <Accordion type="single" collapsible value={isExpanded ? "details" : ""} onValueChange={(value) => setIsExpanded(!!value)} className="mt-2">
          <AccordionItem value="details" className="border-none">
            <AccordionTrigger className="py-1 px-0 hover:no-underline text-muted-foreground">
              <span className="text-[11px]">
                {isExpanded ? "Ocultar" : "Ver"} detalhes
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-0">
              <div className="space-y-1.5 text-xs">
                {auditoria.descricao && (
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    {auditoria.descricao}
                  </p>
                )}
                
                {/* Seções compactas - sempre clicáveis */}
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  <div className="border rounded p-1.5 hover:bg-muted/50 transition-colors cursor-pointer" onClick={onOpenTrabalhos}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <ClipboardList className="h-3 w-3 text-blue-600" />
                        <span className="text-[11px] font-medium">Trabalhos</span>
                      </div>
                      {counts.trabalhos > 0 ? (
                        <Badge variant="outline" className="text-[10px] py-0 h-4 px-1.5">{counts.trabalhos}</Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Nenhum</span>
                      )}
                    </div>
                  </div>

                  <div className="border rounded p-1.5 hover:bg-muted/50 transition-colors cursor-pointer border-l-2 border-l-orange-500" onClick={onOpenAchados}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-orange-600" />
                        <span className="text-[11px] font-medium">Achados</span>
                      </div>
                      {counts.achados > 0 ? (
                        <Badge variant="outline" className="text-[10px] py-0 h-4 px-1.5">{counts.achados}</Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Nenhum</span>
                      )}
                    </div>
                  </div>

                  <div className="border rounded p-1.5 hover:bg-muted/50 transition-colors cursor-pointer border-l-2 border-l-green-500" onClick={onOpenRecomendacoes}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <FileCheck className="h-3 w-3 text-green-600" />
                        <span className="text-[11px] font-medium">Recomendações</span>
                      </div>
                      {counts.recomendacoes > 0 ? (
                        <Badge variant="outline" className="text-[10px] py-0 h-4 px-1.5">{counts.recomendacoes}</Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Nenhum</span>
                      )}
                    </div>
                  </div>

                  <div className="border rounded p-1.5 hover:bg-muted/50 transition-colors cursor-pointer" onClick={onOpenEvidencias}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <ImageIcon className="h-3 w-3 text-purple-600" />
                        <span className="text-[11px] font-medium">Evidências</span>
                      </div>
                      <Plus className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
