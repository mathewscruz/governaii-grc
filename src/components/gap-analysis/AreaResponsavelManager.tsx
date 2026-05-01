import React, { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { logger } from '@/lib/logger';

interface AreaResponsavelManagerProps {
  onAreaSelected: (area: string) => void;
  selectedArea?: string;
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

export const AreaResponsavelManager: React.FC<AreaResponsavelManagerProps> = ({
  onAreaSelected,
  selectedArea
}) => {
  const [customAreas, setCustomAreas] = useState<string[]>([]);
  const [newArea, setNewArea] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { profile } = useAuth();

  // Carregar áreas customizadas do localStorage
  useEffect(() => {
    if (profile?.empresa_id) {
      const savedAreas = localStorage.getItem(`custom_areas_${profile.empresa_id}`);
      if (savedAreas) {
        try {
          setCustomAreas(JSON.parse(savedAreas));
        } catch (error) {
          logger.error("Erro ao carregar áreas customizadas:", error);
        }
      }
    }
  }, [profile?.empresa_id]);

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
    onAreaSelected(newArea.trim());
    setNewArea("");
    setIsDialogOpen(false);
    toast.success("Área adicionada com sucesso");
  };

  const handleRemoveCustomArea = (areaToRemove: string) => {
    const updatedAreas = customAreas.filter(area => area !== areaToRemove);
    saveCustomAreas(updatedAreas);
    
    // Se a área removida estava selecionada, limpar seleção
    if (selectedArea === areaToRemove) {
      onAreaSelected("");
    }
    
    toast.success("Área removida com sucesso");
  };

  const allAreas = [...AREAS_PADRAO, ...customAreas];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>Área Responsável</Label>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-6 w-6 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Gerenciar Áreas Responsáveis</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newArea">Nova Área</Label>
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

              {customAreas.length > 0 && (
                <div className="space-y-2">
                  <Label>Áreas Customizadas</Label>
                  <div className="space-y-1">
                    {customAreas.map((area) => (
                      <div key={area} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{area}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveCustomArea(area)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Áreas Padrão</Label>
                <div className="flex flex-wrap gap-1">
                  {AREAS_PADRAO.map((area) => (
                    <Badge key={area} variant="secondary" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <select
        value={selectedArea || ""}
        onChange={(e) => onAreaSelected(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Selecione uma área responsável</option>
        {allAreas.map((area) => (
          <option key={area} value={area}>
            {area}
          </option>
        ))}
      </select>
    </div>
  );
};