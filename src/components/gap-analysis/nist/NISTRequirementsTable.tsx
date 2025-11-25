import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NIST_PILLARS } from "@/hooks/useNISTScore";
import { CheckCircle2, XCircle, MinusCircle, Ban, Loader2 } from "lucide-react";

interface NISTRequirement {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string | null;
  categoria: string;
  area_responsavel: string | null;
  peso: number;
  obrigatorio: boolean;
  ordem: number;
  conformity_status?: string | null;
  evidence_status?: string | null;
  evaluation_id?: string | null;
}

interface NISTRequirementsTableProps {
  frameworkId: string;
  onStatusChange?: () => void;
}

export const NISTRequirementsTable: React.FC<NISTRequirementsTableProps> = ({
  frameworkId,
  onStatusChange
}) => {
  const [requirements, setRequirements] = useState<NISTRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("GOVERN");

  useEffect(() => {
    loadRequirements();
  }, [frameworkId]);

  const loadRequirements = async () => {
    setLoading(true);
    try {
      // Buscar requisitos
      const { data: reqData, error: reqError } = await supabase
        .from('gap_analysis_requirements')
        .select('*')
        .eq('framework_id', frameworkId)
        .order('ordem', { ascending: true });

      if (reqError) throw reqError;

      // Buscar avaliações
      const { data: evalData, error: evalError } = await supabase
        .from('gap_analysis_evaluations')
        .select('*')
        .eq('framework_id', frameworkId);

      if (evalError) throw evalError;

      // Mapear avaliações
      const evalMap = new Map(evalData?.map(e => [e.requirement_id, e]) || []);

      // Combinar dados
      const enrichedReqs: NISTRequirement[] = reqData?.map(req => ({
        ...req,
        conformity_status: evalMap.get(req.id)?.conformity_status || null,
        evidence_status: evalMap.get(req.id)?.evidence_status || null,
        evaluation_id: evalMap.get(req.id)?.id || null
      })) || [];

      setRequirements(enrichedReqs);
    } catch (error: any) {
      console.error('Error loading requirements:', error);
      toast.error('Erro ao carregar requisitos');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requirementId: string, status: string) => {
    setUpdating(requirementId);
    try {
      const requirement = requirements.find(r => r.id === requirementId);
      if (!requirement) return;

      if (requirement.evaluation_id) {
        // Atualizar avaliação existente
        const { error } = await supabase
          .from('gap_analysis_evaluations')
          .update({ 
            conformity_status: status,
            updated_at: new Date().toISOString()
          })
          .eq('id', requirement.evaluation_id);

        if (error) throw error;
      } else {
        // Criar nova avaliação
        const { error } = await supabase
          .from('gap_analysis_evaluations')
          .insert({
            framework_id: frameworkId,
            requirement_id: requirementId,
            conformity_status: status,
            evidence_status: 'pendente'
          });

        if (error) throw error;
      }

      // Recarregar requirements
      await loadRequirements();
      
      // Notificar mudança
      if (onStatusChange) {
        onStatusChange();
      }

      toast.success('Status atualizado com sucesso');
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'conforme':
        return <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Conforme</Badge>;
      case 'parcial':
        return <Badge variant="warning" className="gap-1"><MinusCircle className="h-3 w-3" /> Parcial</Badge>;
      case 'nao_conforme':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Não Conforme</Badge>;
      case 'nao_aplicavel':
        return <Badge variant="secondary" className="gap-1"><Ban className="h-3 w-3" /> N/A</Badge>;
      default:
        return <Badge variant="outline">Não Avaliado</Badge>;
    }
  };

  const filteredRequirements = requirements.filter(r => r.categoria === activeTab);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Requisitos NIST CSF 2.0</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 mb-6">
            {NIST_PILLARS.map(pillar => (
              <TabsTrigger key={pillar.code} value={pillar.code} className="text-xs">
                {pillar.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {NIST_PILLARS.map(pillar => (
            <TabsContent key={pillar.code} value={pillar.code}>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Código</TableHead>
                      <TableHead>Requisito</TableHead>
                      <TableHead className="w-[120px]">Área</TableHead>
                      <TableHead className="w-[80px] text-center">Peso</TableHead>
                      <TableHead className="w-[150px]">Status</TableHead>
                      <TableHead className="w-[200px]">Avaliação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequirements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhum requisito encontrado para este pilar
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequirements.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-mono text-xs">{req.codigo}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{req.titulo}</p>
                              {req.descricao && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {req.descricao}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{req.area_responsavel}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-xs">
                              {req.peso}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(req.conformity_status)}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={req.conformity_status || ''}
                              onValueChange={(value) => handleStatusChange(req.id, value)}
                              disabled={updating === req.id}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Avaliar..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="conforme">Conforme</SelectItem>
                                <SelectItem value="parcial">Parcial</SelectItem>
                                <SelectItem value="nao_conforme">Não Conforme</SelectItem>
                                <SelectItem value="nao_aplicavel">N/A</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
