import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/integrations/supabase/client";

interface AreaResponsavelInlineSelectProps {
  requirementId: string;
  currentArea?: string | null;
  onAreaChange?: (area: string) => void;
}

const AREAS_PADRAO = [
  "Tecnologia da Informação",
  "Financeiro",
  "Recursos Humanos",
  "Jurídico",
  "Compliance",
  "Auditoria Interna",
  "Operações",
  "Comercial",
  "Marketing",
  "Governança"
];

export const AreaResponsavelInlineSelect: React.FC<AreaResponsavelInlineSelectProps> = ({
  requirementId,
  currentArea,
  onAreaChange
}) => {
  const [customAreas, setCustomAreas] = useState<string[]>([]);
  const [newArea, setNewArea] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState(currentArea || "");
  const { profile } = useAuth();

  const debouncedArea = useDebounce(selectedArea, 500);

  // Carregar áreas customizadas do localStorage
  useEffect(() => {
    if (profile?.empresa_id) {
      const savedAreas = localStorage.getItem(`custom_areas_${profile.empresa_id}`);
      if (savedAreas) {
        try {
          setCustomAreas(JSON.parse(savedAreas));
        } catch (error) {
          console.error("Erro ao carregar áreas customizadas:", error);
        }
      }
    }
  }, [profile?.empresa_id]);

  // Sincronizar com prop externa
  useEffect(() => {
    setSelectedArea(currentArea || "");
  }, [currentArea]);

  // Auto-save quando área é alterada (debounced)
  useEffect(() => {
    if (debouncedArea !== currentArea && requirementId) {
      handleSaveArea(debouncedArea);
    }
  }, [debouncedArea]);

  const handleSaveArea = async (area: string) => {
    try {
      const { error } = await supabase
        .from('gap_analysis_requirements')
        .update({ area_responsavel: area || null })
        .eq('id', requirementId);

      if (error) throw error;

      onAreaChange?.(area);
    } catch (error) {
      console.error('Erro ao salvar área responsável:', error);
      toast.error("Erro ao salvar área responsável");
      // Reverter para valor anterior em caso de erro
      setSelectedArea(currentArea || "");
    }
  };

  // Salvar áreas customizadas no localStorage
  const saveCustomAreas = (areas: string[]) => {
    if (profile?.empresa_id) {
      localStorage.setItem(`custom_areas_${profile.empresa_id}`, JSON.stringify(areas));
      setCustomAreas(areas);
    }
  };

  const handleAddArea = () => {
    if (!newArea.trim()) {
      toast.error("Digite o nome da área responsável");
      return;
    }

    const allAreas = [...AREAS_PADRAO, ...customAreas];
    if (allAreas.some(area => area.toLowerCase() === newArea.trim().toLowerCase())) {
      toast.error("Esta área já existe");
      return;
    }

    const updatedAreas = [...customAreas, newArea.trim()];
    saveCustomAreas(updatedAreas);
    setSelectedArea(newArea.trim());
    setNewArea("");
    setIsDialogOpen(false);
    toast.success("Área adicionada com sucesso");
  };

  const allAreas = [...AREAS_PADRAO, ...customAreas];

  return (
    <div className="flex items-center gap-1">
      <Select value={selectedArea} onValueChange={setSelectedArea}>
        <SelectTrigger className="min-w-[180px] h-8">
          <SelectValue placeholder="Selecionar área" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Nenhuma área</SelectItem>
          {allAreas.map((area) => (
            <SelectItem key={area} value={area}>
              {area}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 shrink-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Área</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newArea">Nome da Área</Label>
              <div className="flex gap-2">
                <Input
                  id="newArea"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  placeholder="Digite o nome da área"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddArea()}
                />
                <Button onClick={handleAddArea} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};