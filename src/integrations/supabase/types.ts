export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ativos: {
        Row: {
          created_at: string
          criticidade: string | null
          data_aquisicao: string | null
          descricao: string | null
          empresa_id: string
          fornecedor: string | null
          id: string
          localizacao: string | null
          nome: string
          proprietario: string | null
          status: string | null
          tags: string[] | null
          tipo: string
          updated_at: string
          valor_negocio: string | null
          versao: string | null
        }
        Insert: {
          created_at?: string
          criticidade?: string | null
          data_aquisicao?: string | null
          descricao?: string | null
          empresa_id: string
          fornecedor?: string | null
          id?: string
          localizacao?: string | null
          nome: string
          proprietario?: string | null
          status?: string | null
          tags?: string[] | null
          tipo: string
          updated_at?: string
          valor_negocio?: string | null
          versao?: string | null
        }
        Update: {
          created_at?: string
          criticidade?: string | null
          data_aquisicao?: string | null
          descricao?: string | null
          empresa_id?: string
          fornecedor?: string | null
          id?: string
          localizacao?: string | null
          nome?: string
          proprietario?: string | null
          status?: string | null
          tags?: string[] | null
          tipo?: string
          updated_at?: string
          valor_negocio?: string | null
          versao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ativos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      controles: {
        Row: {
          area: string | null
          categoria_id: string | null
          created_at: string
          criticidade: string
          data_implementacao: string | null
          descricao: string | null
          empresa_id: string
          frequencia: string | null
          id: string
          nome: string
          processo: string | null
          proxima_avaliacao: string | null
          responsavel: string | null
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          categoria_id?: string | null
          created_at?: string
          criticidade?: string
          data_implementacao?: string | null
          descricao?: string | null
          empresa_id: string
          frequencia?: string | null
          id?: string
          nome: string
          processo?: string | null
          proxima_avaliacao?: string | null
          responsavel?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          categoria_id?: string | null
          created_at?: string
          criticidade?: string
          data_implementacao?: string | null
          descricao?: string | null
          empresa_id?: string
          frequencia?: string | null
          id?: string
          nome?: string
          processo?: string | null
          proxima_avaliacao?: string | null
          responsavel?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "controles_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "controles_categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      controles_ativos: {
        Row: {
          ativo_id: string
          controle_id: string
          created_at: string
          id: string
          observacoes: string | null
          tipo_protecao: string
        }
        Insert: {
          ativo_id: string
          controle_id: string
          created_at?: string
          id?: string
          observacoes?: string | null
          tipo_protecao?: string
        }
        Update: {
          ativo_id?: string
          controle_id?: string
          created_at?: string
          id?: string
          observacoes?: string | null
          tipo_protecao?: string
        }
        Relationships: [
          {
            foreignKeyName: "controles_ativos_ativo_id_fkey"
            columns: ["ativo_id"]
            isOneToOne: false
            referencedRelation: "ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controles_ativos_controle_id_fkey"
            columns: ["controle_id"]
            isOneToOne: false
            referencedRelation: "controles"
            referencedColumns: ["id"]
          },
        ]
      }
      controles_categorias: {
        Row: {
          cor: string | null
          created_at: string
          descricao: string | null
          empresa_id: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      controles_riscos: {
        Row: {
          controle_id: string
          created_at: string
          eficacia_estimada: string | null
          id: string
          observacoes: string | null
          risco_id: string
          tipo_vinculacao: string
        }
        Insert: {
          controle_id: string
          created_at?: string
          eficacia_estimada?: string | null
          id?: string
          observacoes?: string | null
          risco_id: string
          tipo_vinculacao?: string
        }
        Update: {
          controle_id?: string
          created_at?: string
          eficacia_estimada?: string | null
          id?: string
          observacoes?: string | null
          risco_id?: string
          tipo_vinculacao?: string
        }
        Relationships: [
          {
            foreignKeyName: "controles_riscos_controle_id_fkey"
            columns: ["controle_id"]
            isOneToOne: false
            referencedRelation: "controles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controles_riscos_risco_id_fkey"
            columns: ["risco_id"]
            isOneToOne: false
            referencedRelation: "riscos"
            referencedColumns: ["id"]
          },
        ]
      }
      controles_testes: {
        Row: {
          controle_id: string
          created_at: string
          data_teste: string
          evidencias: string | null
          id: string
          observacoes: string | null
          proxima_avaliacao: string | null
          resultado: string
          testador: string | null
          updated_at: string
        }
        Insert: {
          controle_id: string
          created_at?: string
          data_teste: string
          evidencias?: string | null
          id?: string
          observacoes?: string | null
          proxima_avaliacao?: string | null
          resultado: string
          testador?: string | null
          updated_at?: string
        }
        Update: {
          controle_id?: string
          created_at?: string
          data_teste?: string
          evidencias?: string | null
          id?: string
          observacoes?: string | null
          proxima_avaliacao?: string | null
          resultado?: string
          testador?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "controles_testes_controle_id_fkey"
            columns: ["controle_id"]
            isOneToOne: false
            referencedRelation: "controles"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          ativo: boolean
          cnpj: string | null
          contato: string | null
          created_at: string
          id: string
          logo_url: string | null
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link_to: string | null
          message: string | null
          read: boolean | null
          title: string
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link_to?: string | null
          message?: string | null
          read?: boolean | null
          title: string
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link_to?: string | null
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          empresa_id: string | null
          foto_url: string | null
          id: string
          nome: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          empresa_id?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          empresa_id?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      riscos: {
        Row: {
          aceito: boolean | null
          aprovador_aceite: string | null
          categoria_id: string | null
          causas: string | null
          consequencias: string | null
          controles_existentes: string | null
          created_at: string
          data_aceite: string | null
          data_avaliacao: string | null
          data_identificacao: string
          descricao: string | null
          empresa_id: string
          id: string
          impacto_inicial: string
          impacto_residual: string | null
          justificativa_aceite: string | null
          matriz_id: string | null
          nivel_risco_inicial: string
          nivel_risco_residual: string | null
          nome: string
          probabilidade_inicial: string
          probabilidade_residual: string | null
          responsavel: string | null
          status: string
          updated_at: string
        }
        Insert: {
          aceito?: boolean | null
          aprovador_aceite?: string | null
          categoria_id?: string | null
          causas?: string | null
          consequencias?: string | null
          controles_existentes?: string | null
          created_at?: string
          data_aceite?: string | null
          data_avaliacao?: string | null
          data_identificacao?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          impacto_inicial: string
          impacto_residual?: string | null
          justificativa_aceite?: string | null
          matriz_id?: string | null
          nivel_risco_inicial: string
          nivel_risco_residual?: string | null
          nome: string
          probabilidade_inicial: string
          probabilidade_residual?: string | null
          responsavel?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          aceito?: boolean | null
          aprovador_aceite?: string | null
          categoria_id?: string | null
          causas?: string | null
          consequencias?: string | null
          controles_existentes?: string | null
          created_at?: string
          data_aceite?: string | null
          data_avaliacao?: string | null
          data_identificacao?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          impacto_inicial?: string
          impacto_residual?: string | null
          justificativa_aceite?: string | null
          matriz_id?: string | null
          nivel_risco_inicial?: string
          nivel_risco_residual?: string | null
          nome?: string
          probabilidade_inicial?: string
          probabilidade_residual?: string | null
          responsavel?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "riscos_aprovador_aceite_fkey"
            columns: ["aprovador_aceite"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "riscos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "riscos_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riscos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riscos_matriz_id_fkey"
            columns: ["matriz_id"]
            isOneToOne: false
            referencedRelation: "riscos_matrizes"
            referencedColumns: ["id"]
          },
        ]
      }
      riscos_ativos: {
        Row: {
          ativo_id: string
          created_at: string
          id: string
          observacao: string | null
          risco_id: string
        }
        Insert: {
          ativo_id: string
          created_at?: string
          id?: string
          observacao?: string | null
          risco_id: string
        }
        Update: {
          ativo_id?: string
          created_at?: string
          id?: string
          observacao?: string | null
          risco_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "riscos_ativos_ativo_id_fkey"
            columns: ["ativo_id"]
            isOneToOne: false
            referencedRelation: "ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riscos_ativos_risco_id_fkey"
            columns: ["risco_id"]
            isOneToOne: false
            referencedRelation: "riscos"
            referencedColumns: ["id"]
          },
        ]
      }
      riscos_categorias: {
        Row: {
          cor: string | null
          created_at: string
          descricao: string | null
          empresa_id: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "riscos_categorias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      riscos_matriz_configuracao: {
        Row: {
          created_at: string
          escala_impacto: Json
          escala_probabilidade: Json
          id: string
          matriz_id: string
          metodo_calculo: string
          niveis_risco: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          escala_impacto: Json
          escala_probabilidade: Json
          id?: string
          matriz_id: string
          metodo_calculo?: string
          niveis_risco: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          escala_impacto?: Json
          escala_probabilidade?: Json
          id?: string
          matriz_id?: string
          metodo_calculo?: string
          niveis_risco?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "riscos_matriz_configuracao_matriz_id_fkey"
            columns: ["matriz_id"]
            isOneToOne: false
            referencedRelation: "riscos_matrizes"
            referencedColumns: ["id"]
          },
        ]
      }
      riscos_matrizes: {
        Row: {
          created_at: string
          descricao: string | null
          empresa_id: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "riscos_matrizes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      riscos_tratamentos: {
        Row: {
          created_at: string
          custo: number | null
          data_conclusao: string | null
          data_inicio: string | null
          descricao: string
          eficacia: string | null
          id: string
          prazo: string | null
          responsavel: string | null
          risco_id: string
          status: string
          tipo_tratamento: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custo?: number | null
          data_conclusao?: string | null
          data_inicio?: string | null
          descricao: string
          eficacia?: string | null
          id?: string
          prazo?: string | null
          responsavel?: string | null
          risco_id: string
          status?: string
          tipo_tratamento: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custo?: number | null
          data_conclusao?: string | null
          data_inicio?: string | null
          descricao?: string
          eficacia?: string | null
          id?: string
          prazo?: string | null
          responsavel?: string | null
          risco_id?: string
          status?: string
          tipo_tratamento?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "riscos_tratamentos_risco_id_fkey"
            columns: ["risco_id"]
            isOneToOne: false
            referencedRelation: "riscos"
            referencedColumns: ["id"]
          },
        ]
      }
      temporary_passwords: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_temporary: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_temporary?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_temporary?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      controle_pertence_empresa: {
        Args: { controle_id: string }
        Returns: boolean
      }
      generate_temp_password: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_empresa_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin_or_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      matriz_pertence_empresa: {
        Args: { matriz_id: string }
        Returns: boolean
      }
      risco_pertence_empresa: {
        Args: { risco_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "super_admin" | "admin" | "user" | "readonly"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["super_admin", "admin", "user", "readonly"],
    },
  },
} as const
