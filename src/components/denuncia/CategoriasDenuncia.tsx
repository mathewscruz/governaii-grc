import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Tag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Categoria {
  id: string;
  nome: string;
  descricao: string;
  cor: string;
  ativo: boolean;
  created_at: string;
}

const coresPredefinidas = [
  '#EF4444', // red
  '#F97316', // orange  
  '#F59E0B', // yellow
  '#10B981', // green
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#6B7280', // gray
  '#0891B2'  // cyan
];

export function CategoriasDenuncia() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState<Categoria | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cor: '#EF4444'
  });

  useEffect(() => {
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('denuncias_categorias')
        .select('*')
        .order('nome');

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar categorias",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialog = (categoria?: Categoria) => {
    if (categoria) {
      setEditingCategoria(categoria);
      setFormData({
        nome: categoria.nome,
        descricao: categoria.descricao,
        cor: categoria.cor
      });
    } else {
      setEditingCategoria(null);
      setFormData({
        nome: '',
        descricao: '',
        cor: '#EF4444'
      });
    }
    setDialogOpen(true);
  };

  const fecharDialog = () => {
    setDialogOpen(false);
    setEditingCategoria(null);
    setFormData({ nome: '', descricao: '', cor: '#EF4444' });
  };

  const handleSalvar = async () => {
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      if (editingCategoria) {
        // Atualizar categoria existente
        const { error } = await supabase
          .from('denuncias_categorias')
          .update({
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim(),
            cor: formData.cor
          })
          .eq('id', editingCategoria.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Categoria atualizada com sucesso"
        });
      } else {
        // Criar nova categoria - empresa_id será definido pelo DEFAULT na tabela
        const { error } = await supabase
          .from('denuncias_categorias')
          .insert([{
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim(),
            cor: formData.cor
          }]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Categoria criada com sucesso"
        });
      }

      fecharDialog();
      carregarCategorias();
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
      toast({
        title: "Erro",
        description: error.message?.includes('duplicate') 
          ? "Já existe uma categoria com este nome"
          : "Erro ao salvar categoria",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmarDelete = (categoria: Categoria) => {
    setCategoriaToDelete(categoria);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!categoriaToDelete) return;

    try {
      const { error } = await supabase
        .from('denuncias_categorias')
        .delete()
        .eq('id', categoriaToDelete.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso"
      });

      carregarCategorias();
    } catch (error: any) {
      console.error('Erro ao excluir categoria:', error);
      toast({
        title: "Erro",
        description: error.message?.includes('foreign key') 
          ? "Não é possível excluir esta categoria pois existem denúncias vinculadas"
          : "Erro ao excluir categoria",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setCategoriaToDelete(null);
    }
  };

  const toggleAtivo = async (categoria: Categoria) => {
    try {
      const { error } = await supabase
        .from('denuncias_categorias')
        .update({ ativo: !categoria.ativo })
        .eq('id', categoria.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Categoria ${!categoria.ativo ? 'ativada' : 'desativada'} com sucesso`
      });

      carregarCategorias();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da categoria",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Categorias de Denúncia</h2>
          <p className="text-muted-foreground">
            Gerencie as categorias para classificar as denúncias
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => abrirDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
              </DialogTitle>
              <DialogDescription>
                {editingCategoria 
                  ? 'Edite as informações da categoria'
                  : 'Crie uma nova categoria para classificar denúncias'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Assédio, Corrupção, Fraude..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descrição da categoria..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {coresPredefinidas.map((cor) => (
                    <button
                      key={cor}
                      onClick={() => setFormData(prev => ({ ...prev, cor }))}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.cor === cor ? 'border-primary scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: cor }}
                    />
                  ))}
                </div>
                <Input
                  type="color"
                  value={formData.cor}
                  onChange={(e) => setFormData(prev => ({ ...prev, cor: e.target.value }))}
                  className="w-20 h-10"
                />
              </div>

              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  style={{ backgroundColor: formData.cor, color: 'white' }}
                >
                  {formData.nome || 'Preview'}
                </Badge>
                <span className="text-sm text-muted-foreground">Preview</span>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={fecharDialog}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSalvar} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Categorias Cadastradas
          </CardTitle>
          <CardDescription>
            {categorias.length} categoria(s) cadastrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categorias.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categorias.map((categoria) => (
                    <TableRow key={categoria.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: categoria.cor }}
                          />
                          <span className="font-medium">{categoria.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {categoria.descricao || '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAtivo(categoria)}
                        >
                          <Badge variant={categoria.ativo ? "default" : "secondary"}>
                            {categoria.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </Button>
                      </TableCell>
                      <TableCell>
                        {format(new Date(categoria.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirDialog(categoria)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmarDelete(categoria)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma categoria cadastrada</p>
              <p className="text-sm">Clique em "Nova Categoria" para começar</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Categoria"
        description={`Tem certeza que deseja excluir a categoria "${categoriaToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}