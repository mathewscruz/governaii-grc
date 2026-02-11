
-- 1. Inserir módulo planos-acao em system_modules
INSERT INTO system_modules (name, display_name, description, icon, route_path, order_index, is_active)
VALUES ('planos-acao', 'Planos de Ação', 'Gestão de planos de ação e tarefas', 'ListTodo', '/planos-acao', 2, true)
ON CONFLICT DO NOTHING;

-- 2. Conceder permissões padrão aos usuários existentes
INSERT INTO user_module_permissions (user_id, module_id, can_access, can_create, can_read, can_update, can_delete)
SELECT DISTINCT ump.user_id, sm.id, true, true, true, true, false
FROM user_module_permissions ump
CROSS JOIN system_modules sm
WHERE sm.name = 'planos-acao'
AND NOT EXISTS (
  SELECT 1 FROM user_module_permissions existing
  WHERE existing.user_id = ump.user_id AND existing.module_id = sm.id
);
