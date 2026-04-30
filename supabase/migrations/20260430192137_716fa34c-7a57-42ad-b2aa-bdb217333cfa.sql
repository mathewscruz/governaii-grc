-- ============================================================================
-- Tenant isolation hardening: add WITH CHECK to all UPDATE policies
-- on tables with empresa_id, preventing "tenant hijack via UPDATE"
-- (a user moving their row to another empresa by changing empresa_id).
-- Each policy is dropped and recreated with the same USING + a matching
-- WITH CHECK that pins empresa_id to the caller's empresa.
-- ============================================================================

-- ===== Standard pattern: empresa_id = get_user_empresa_id() =====
DROP POLICY IF EXISTS "Admins podem atualizar revisões" ON public.access_reviews;
CREATE POLICY "Admins podem atualizar revisões" ON public.access_reviews FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update agents from their empresa" ON public.asset_agents;
CREATE POLICY "Users can update agents from their empresa" ON public.asset_agents FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update ativos from their empresa" ON public.ativos;
CREATE POLICY "Users can update ativos from their empresa" ON public.ativos FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update chaves from their empresa" ON public.ativos_chaves_criptograficas;
CREATE POLICY "Users can update chaves from their empresa" ON public.ativos_chaves_criptograficas FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update licencas from their empresa" ON public.ativos_licencas;
CREATE POLICY "Users can update licencas from their empresa" ON public.ativos_licencas FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update locations from their empresa" ON public.ativos_localizacoes;
CREATE POLICY "Users can update locations from their empresa" ON public.ativos_localizacoes FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update manutencoes from their empresa" ON public.ativos_manutencoes;
CREATE POLICY "Users can update manutencoes from their empresa" ON public.ativos_manutencoes FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update areas from their company" ON public.auditoria_areas_sistemas;
CREATE POLICY "Users can update areas from their company" ON public.auditoria_areas_sistemas FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update audits from their empresa" ON public.auditorias;
CREATE POLICY "Users can update audits from their empresa" ON public.auditorias FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update accounts from their empresa" ON public.contas_privilegiadas;
CREATE POLICY "Users can update accounts from their empresa" ON public.contas_privilegiadas FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update their company plans" ON public.continuidade_planos;
CREATE POLICY "Users can update their company plans" ON public.continuidade_planos FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update their company tasks" ON public.continuidade_tarefas;
CREATE POLICY "Users can update their company tasks" ON public.continuidade_tarefas FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update their company tests" ON public.continuidade_testes;
CREATE POLICY "Users can update their company tests" ON public.continuidade_testes FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update contratos from their empresa" ON public.contratos;
CREATE POLICY "Users can update contratos from their empresa" ON public.contratos FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update controls from their empresa" ON public.controles;
CREATE POLICY "Users can update controls from their empresa" ON public.controles FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update control categories from their empresa" ON public.controles_categorias;
CREATE POLICY "Users can update control categories from their empresa" ON public.controles_categorias FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update dados fluxos from their empresa" ON public.dados_fluxos;
CREATE POLICY "Users can update dados fluxos from their empresa" ON public.dados_fluxos FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update dados pessoais from their empresa" ON public.dados_pessoais;
CREATE POLICY "Users can update dados pessoais from their empresa" ON public.dados_pessoais FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update solicitacoes titular from their empresa" ON public.dados_solicitacoes_titular;
CREATE POLICY "Users can update solicitacoes titular from their empresa" ON public.dados_solicitacoes_titular FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update denuncias from their empresa" ON public.denuncias;
CREATE POLICY "Users can update denuncias from their empresa" ON public.denuncias FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update conversations from their empresa" ON public.docgen_conversations;
CREATE POLICY "Users can update conversations from their empresa" ON public.docgen_conversations FOR UPDATE
  USING ((empresa_id = get_user_empresa_id()) AND (user_id = auth.uid()))
  WITH CHECK ((empresa_id = get_user_empresa_id()) AND (user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update generated docs from their empresa" ON public.docgen_generated_docs;
CREATE POLICY "Users can update generated docs from their empresa" ON public.docgen_generated_docs FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update layouts from their empresa" ON public.docgen_layouts;
CREATE POLICY "Users can update layouts from their empresa" ON public.docgen_layouts FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update learning patterns from their empresa" ON public.docgen_learning_patterns;
CREATE POLICY "Users can update learning patterns from their empresa" ON public.docgen_learning_patterns FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update templates from their empresa" ON public.docgen_templates;
CREATE POLICY "Users can update templates from their empresa" ON public.docgen_templates FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update documents from their empresa" ON public.documentos;
CREATE POLICY "Users can update documents from their empresa" ON public.documentos FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update document categories from their empresa" ON public.documentos_categorias;
CREATE POLICY "Users can update document categories from their empresa" ON public.documentos_categorias FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update integrations from their empresa" ON public.due_diligence_integrations;
CREATE POLICY "Users can update integrations from their empresa" ON public.due_diligence_integrations FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update fornecedores from their empresa" ON public.fornecedores;
CREATE POLICY "Users can update fornecedores from their empresa" ON public.fornecedores FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update adherence assessments from their company" ON public.gap_analysis_adherence_assessments;
CREATE POLICY "Users can update adherence assessments from their company" ON public.gap_analysis_adherence_assessments FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update assessments from their empresa" ON public.gap_analysis_assessments;
CREATE POLICY "Users can update assessments from their empresa" ON public.gap_analysis_assessments FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update evaluations from their empresa" ON public.gap_analysis_evaluations;
CREATE POLICY "Users can update evaluations from their empresa" ON public.gap_analysis_evaluations FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update frameworks for their company" ON public.gap_analysis_frameworks;
CREATE POLICY "Users can update frameworks for their company" ON public.gap_analysis_frameworks FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update frameworks from their empresa" ON public.gap_analysis_frameworks;
CREATE POLICY "Users can update frameworks from their empresa" ON public.gap_analysis_frameworks FOR UPDATE
  USING ((empresa_id = get_user_empresa_id()) AND (is_template = false))
  WITH CHECK ((empresa_id = get_user_empresa_id()) AND (is_template = false));

DROP POLICY IF EXISTS "Users can update own empresa SoA" ON public.gap_analysis_soa;
CREATE POLICY "Users can update own empresa SoA" ON public.gap_analysis_soa FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update incidentes from their empresa" ON public.incidentes;
CREATE POLICY "Users can update incidentes from their empresa" ON public.incidentes FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Admins can update integrations from their empresa" ON public.integracoes_config;
CREATE POLICY "Admins can update integrations from their empresa" ON public.integracoes_config FOR UPDATE
  USING ((empresa_id = get_user_empresa_id()) AND is_admin_or_super_admin())
  WITH CHECK ((empresa_id = get_user_empresa_id()) AND is_admin_or_super_admin());

DROP POLICY IF EXISTS "Admins can update permission profiles" ON public.permission_profiles;
CREATE POLICY "Admins can update permission profiles" ON public.permission_profiles FOR UPDATE
  USING ((empresa_id = get_user_empresa_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)))
  WITH CHECK ((empresa_id = get_user_empresa_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)));

DROP POLICY IF EXISTS "Admins can update users" ON public.profiles;
CREATE POLICY "Admins can update users" ON public.profiles FOR UPDATE
  USING (is_admin() AND (is_super_admin() OR (empresa_id = get_user_empresa_id())))
  WITH CHECK (is_admin() AND (is_super_admin() OR (empresa_id = get_user_empresa_id())));

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE
  USING (is_super_admin() OR (is_admin() AND (empresa_id = get_user_empresa_id())) OR (user_id = auth.uid()))
  WITH CHECK (is_super_admin() OR (is_admin() AND (empresa_id = get_user_empresa_id())) OR (user_id = auth.uid()));

DROP POLICY IF EXISTS "agendamentos_update" ON public.relatorio_agendamentos;
CREATE POLICY "agendamentos_update" ON public.relatorio_agendamentos FOR UPDATE
  USING (empresa_id IN (SELECT profiles.empresa_id FROM profiles WHERE profiles.user_id = auth.uid()))
  WITH CHECK (empresa_id IN (SELECT profiles.empresa_id FROM profiles WHERE profiles.user_id = auth.uid()));

DROP POLICY IF EXISTS "planos_acao_update" ON public.planos_acao;
CREATE POLICY "planos_acao_update" ON public.planos_acao FOR UPDATE
  USING (empresa_id IN (SELECT profiles.empresa_id FROM profiles WHERE profiles.user_id = auth.uid()))
  WITH CHECK (empresa_id IN (SELECT profiles.empresa_id FROM profiles WHERE profiles.user_id = auth.uid()));

DROP POLICY IF EXISTS "relatorios_update" ON public.relatorios_customizados;
CREATE POLICY "relatorios_update" ON public.relatorios_customizados FOR UPDATE
  USING (empresa_id IN (SELECT profiles.empresa_id FROM profiles WHERE profiles.user_id = auth.uid()))
  WITH CHECK (empresa_id IN (SELECT profiles.empresa_id FROM profiles WHERE profiles.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update risks from their empresa" ON public.riscos;
CREATE POLICY "Users can update risks from their empresa" ON public.riscos FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update anexos from their empresa riscos" ON public.riscos_anexos;
CREATE POLICY "Users can update anexos from their empresa riscos" ON public.riscos_anexos FOR UPDATE
  USING (risco_pertence_empresa(risco_id))
  WITH CHECK (risco_pertence_empresa(risco_id));

DROP POLICY IF EXISTS "Users can update risk categories from their empresa" ON public.riscos_categorias;
CREATE POLICY "Users can update risk categories from their empresa" ON public.riscos_categorias FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update matrices from their empresa" ON public.riscos_matrizes;
CREATE POLICY "Users can update matrices from their empresa" ON public.riscos_matrizes FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update ROPA from their empresa" ON public.ropa_registros;
CREATE POLICY "Users can update ROPA from their empresa" ON public.ropa_registros FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update systems from their empresa" ON public.sistemas_privilegiados;
CREATE POLICY "Users can update systems from their empresa" ON public.sistemas_privilegiados FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Users can update sistemas_usuarios from their empresa" ON public.sistemas_usuarios;
CREATE POLICY "Users can update sistemas_usuarios from their empresa" ON public.sistemas_usuarios FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS "Admins can update reminders from their empresa" ON public.user_invitation_reminders;
CREATE POLICY "Admins can update reminders from their empresa" ON public.user_invitation_reminders FOR UPDATE
  USING ((empresa_id = get_user_empresa_id()) AND is_admin())
  WITH CHECK ((empresa_id = get_user_empresa_id()) AND is_admin());