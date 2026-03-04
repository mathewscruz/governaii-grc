
-- Allow anon to read changelog (public info)
CREATE POLICY "Anyone can read changelog"
  ON public.changelog_entries FOR SELECT
  TO anon
  USING (true);

-- Seed initial changelog data
INSERT INTO public.changelog_entries (version, release_date, items)
VALUES 
  ('v2.9', '2026-03-04', '[
    {"type": "feature", "text": "Diagnóstico rápido com IA nos requisitos"},
    {"type": "feature", "text": "Relatório executivo Board (5 páginas)"},
    {"type": "feature", "text": "Declaração de Aplicabilidade (SoA)"},
    {"type": "improvement", "text": "Contexto da organização migrado para Configurações"},
    {"type": "improvement", "text": "Changelog dinâmico com notificações automáticas"}
  ]'::jsonb),
  ('v2.8', '2026-02-10', '[
    {"type": "feature", "text": "Busca global com Cmd+K"},
    {"type": "feature", "text": "Changelog de novidades"},
    {"type": "improvement", "text": "Dashboard com KPIs expandidos"},
    {"type": "improvement", "text": "Sidebar com animações refinadas"},
    {"type": "improvement", "text": "Notificações priorizadas por severidade"}
  ]'::jsonb),
  ('v2.7', '2026-02-03', '[
    {"type": "feature", "text": "Módulo de Políticas corporativas"},
    {"type": "feature", "text": "Planos de Ação com visão Kanban"},
    {"type": "improvement", "text": "Avaliação de Aderência com IA"},
    {"type": "fix", "text": "Correções de performance no Gap Analysis"}
  ]'::jsonb);
