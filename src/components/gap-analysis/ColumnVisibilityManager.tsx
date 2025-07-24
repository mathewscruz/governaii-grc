import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Columns3, RotateCcw } from "lucide-react";

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  required?: boolean; // Colunas obrigatórias não podem ser ocultadas
  defaultVisible?: boolean;
}

interface ColumnVisibilityManagerProps {
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
  storageKey?: string;
}

export const ColumnVisibilityManager: React.FC<ColumnVisibilityManagerProps> = ({
  columns,
  onColumnsChange,
  storageKey = "gap-analysis-columns"
}) => {
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns);

  // Carregar preferências do localStorage na inicialização
  useEffect(() => {
    const savedConfig = localStorage.getItem(storageKey);
    if (savedConfig) {
      try {
        const savedColumns = JSON.parse(savedConfig);
        const updatedColumns = columns.map(col => {
          const saved = savedColumns.find((s: any) => s.key === col.key);
          return {
            ...col,
            visible: saved ? saved.visible : col.defaultVisible ?? col.visible
          };
        });
        setLocalColumns(updatedColumns);
        onColumnsChange(updatedColumns);
      } catch (error) {
        console.error('Erro ao carregar configuração de colunas:', error);
      }
    }
  }, [columns, onColumnsChange, storageKey]);

  // Salvar preferências no localStorage
  const saveToStorage = (updatedColumns: ColumnConfig[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedColumns));
    } catch (error) {
      console.error('Erro ao salvar configuração de colunas:', error);
    }
  };

  const handleColumnToggle = (columnKey: string, checked: boolean) => {
    const updatedColumns = localColumns.map(col => 
      col.key === columnKey ? { ...col, visible: checked } : col
    );
    setLocalColumns(updatedColumns);
    onColumnsChange(updatedColumns);
    saveToStorage(updatedColumns);
  };

  const handleResetToDefault = () => {
    const defaultColumns = columns.map(col => ({
      ...col,
      visible: col.defaultVisible ?? col.visible
    }));
    setLocalColumns(defaultColumns);
    onColumnsChange(defaultColumns);
    saveToStorage(defaultColumns);
  };

  const visibleCount = localColumns.filter(col => col.visible).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Columns3 className="h-4 w-4 mr-2" />
          Colunas ({visibleCount})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 bg-background border-border shadow-lg"
        style={{ zIndex: 9999 }}
      >
        <DropdownMenuLabel className="text-sm font-medium">
          Gerenciar Colunas Visíveis
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {localColumns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.key}
            checked={column.visible}
            onCheckedChange={(checked) => handleColumnToggle(column.key, checked)}
            disabled={column.required}
            className="text-sm"
          >
            <span className={column.required ? "font-medium" : ""}>
              {column.label}
            </span>
            {column.required && (
              <span className="text-xs text-muted-foreground ml-1">
                (obrigatória)
              </span>
            )}
          </DropdownMenuCheckboxItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          onSelect={(e) => e.preventDefault()}
          onCheckedChange={handleResetToDefault}
          className="text-sm text-muted-foreground"
        >
          <RotateCcw className="h-3 w-3 mr-2" />
          Restaurar Padrão
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};