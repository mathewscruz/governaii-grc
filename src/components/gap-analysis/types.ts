export interface Requirement {
  id: string;
  framework_id: string;
  codigo?: string | null;
  titulo: string;
  descricao?: string | null;
  categoria?: string | null;
  area_responsavel?: string | null;
  peso?: number | null;
  obrigatorio?: boolean | null;
  ordem?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface Framework {
  id: string;
  nome: string;
  versao: string;
  tipo_framework: string;
  tipo?: 'padrao' | 'personalizado';
  descricao?: string;
  assessment_count?: number;
}