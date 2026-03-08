import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FornecedorValue {
  nome: string;
  email: string;
}

interface FornecedorSelectorProps {
  value: FornecedorValue;
  onChange: (value: FornecedorValue) => void;
}

export function FornecedorSelector({ value, onChange }: FornecedorSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="fornecedor_nome">Nome do Fornecedor *</Label>
        <Input
          id="fornecedor_nome"
          value={value.nome}
          onChange={(e) => onChange({ ...value, nome: e.target.value })}
          placeholder="Nome do fornecedor"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fornecedor_email">E-mail do Fornecedor *</Label>
        <Input
          id="fornecedor_email"
          type="email"
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
          placeholder="email@fornecedor.com"
        />
      </div>
    </div>
  );
}
