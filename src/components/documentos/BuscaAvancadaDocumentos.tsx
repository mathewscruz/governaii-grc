import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Categoria {
  id: string;
  nome: string;
}

interface BuscaAvancadaDocumentosProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (filters: any) => void;
  categorias: Categoria[];
}

export function BuscaAvancadaDocumentos({ open, onOpenChange, onSearch, categorias }: BuscaAvancadaDocumentosProps) {
  const [filters, setFilters] = useState({
    nome: '',
    tipo: '',
    categoria: '',
    status: '',
    data_inicio: '',
    data_fim: ''
  });

  const handleSearch = () => {
    onSearch(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setFilters({
      nome: '',
      tipo: '',
      categoria: '',
      status: '',
      data_inicio: '',
      data_fim: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Busca Avançada</DialogTitle>
          <DialogDescription>
            Use os filtros abaixo para encontrar documentos específicos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Documento</Label>
              <Input
                id="nome"
                value={filters.nome}
                onChange={(e) => setFilters(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome do documento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={filters.tipo} onValueChange={(value) => setFilters(prev => ({ ...prev, tipo: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  <SelectItem value="politica">Política</SelectItem>
                  <SelectItem value="procedimento">Procedimento</SelectItem>
                  <SelectItem value="instrucao">Instrução</SelectItem>
                  <SelectItem value="formulario">Formulário</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={filters.categoria} onValueChange={(value) => setFilters(prev => ({ ...prev, categoria: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as categorias</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.nome}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="arquivado">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            Limpar
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSearch}>
            Buscar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}