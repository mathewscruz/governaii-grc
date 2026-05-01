import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatStatus } from '@/lib/text-utils';

interface AreaSistema {
  id: string;
  nome: string;
  tipo: string | null;
  descricao: string | null;
}

interface AreaSistemaSelectProps {
  auditoriaId: string;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function AreaSistemaSelect({
  auditoriaId,
  value,
  onValueChange,
  placeholder = "Selecionar área/sistema...",
}: AreaSistemaSelectProps) {
  const { empresaId } = useEmpresaId();
  const [areas, setAreas] = useState<AreaSistema[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newAreaNome, setNewAreaNome] = useState("");

  useEffect(() => {
    if (empresaId) {
      fetchAreas();
    }
  }, [empresaId, auditoriaId]);

  const fetchAreas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("auditoria_areas_sistemas")
        .select("id, nome, tipo, descricao")
        .eq("empresa_id", empresaId!)
        .order("nome");

      if (error) throw error;
      setAreas(data || []);
    } catch (error) {
      console.error("Erro ao buscar áreas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddArea = async () => {
    if (!newAreaNome.trim() || !empresaId) return;

    try {
      const { data, error } = await supabase
        .from("auditoria_areas_sistemas")
        .insert([{
          nome: newAreaNome.trim(),
          tipo: "area",
          empresa_id: empresaId,
          auditoria_id: auditoriaId,
        }])
        .select()
        .single();

      if (error) throw error;

      setAreas([...areas, data]);
      onValueChange(data.id);
      setNewAreaNome("");
      setIsAdding(false);
      toast.success("Área/sistema criado com sucesso");
    } catch (error: any) {
      console.error("Erro ao criar área:", error);
      toast.error("Erro ao criar área/sistema");
    }
  };

  return (
    <div className="space-y-2">
      <Select value={value || "_none"} onValueChange={(v) => onValueChange(v === "_none" ? "" : v)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder}>
            {value && areas.find((a) => a.id === value)?.nome}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_none">
            <span className="text-muted-foreground">Nenhum</span>
          </SelectItem>
          {loading ? (
            <SelectItem value="_loading" disabled>
              Carregando...
            </SelectItem>
          ) : (
            areas.map((area) => (
              <SelectItem key={area.id} value={area.id}>
                <div className="flex items-center gap-2">
                  <Building className="h-3 w-3 text-muted-foreground" />
                  <span>{area.nome}</span>
                  {area.tipo && (
                    <span className="text-xs text-muted-foreground">({formatStatus(area.tipo)})</span>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {isAdding ? (
        <div className="flex gap-2">
          <Input
            value={newAreaNome}
            onChange={(e) => setNewAreaNome(e.target.value)}
            placeholder="Nome da nova área/sistema"
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleAddArea()}
          />
          <Button size="sm" onClick={handleAddArea} disabled={!newAreaNome.trim()}>
            Adicionar
          </Button>
          <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Nova Área/Sistema
        </Button>
      )}
    </div>
  );
}
