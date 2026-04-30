INSERT INTO public.changelog_entries (version, release_date, items) VALUES (
  'v3.0',
  '2026-04-30',
  '[
    {"type": "feature", "text": "Novo ícone exclusivo Akuris no toggle do menu lateral, reforçando a identidade visual da plataforma."},
    {"type": "feature", "text": "Painel de gestão de Novidades para super-administradores: agora você publica versões direto pela tela de Configurações."},
    {"type": "improvement", "text": "Hardening de segurança multi-tenant: políticas de atualização revisadas em todos os módulos para impedir movimentação indevida de dados entre empresas."},
    {"type": "improvement", "text": "Aba ''Empresas'' restrita exclusivamente a super-administradores, com proteção redundante na interface."},
    {"type": "improvement", "text": "Administradores agora visualizam e gerenciam apenas usuários da própria empresa em ''Usuários & Acessos''."},
    {"type": "improvement", "text": "Módulo dedicado de Políticas removido — a classificação ''Política'' permanece disponível dentro do módulo de Documentos."},
    {"type": "improvement", "text": "Endurecimento da exclusão de usuários: bloqueio de exclusão entre empresas e proteção contra remoção de super-admins por administradores comuns."}
  ]'::jsonb
);