
# Correção: Planos de Ação visível para todos os usuários

## Problema
O módulo "Planos de Ação" só aparece para super_admin porque:
1. O módulo `planos-acao` **não existe** na tabela `system_modules` do banco de dados, então nenhum perfil de permissão consegue incluí-lo
2. A rota usa `fallbackToRoleCheck={false}`, bloqueando o acesso via sistema de roles tradicional

## Correções

### 1. Adicionar módulo na tabela `system_modules` (migração SQL)
Inserir o registro `planos-acao` na tabela `system_modules` para que ele apareça na gestão de perfis de permissão:

```sql
INSERT INTO system_modules (name, display_name, description, icon, route_path, order_index, is_active)
VALUES ('planos-acao', 'Planos de Ação', 'Gestão de planos de ação e tarefas', 'ListTodo', '/planos-acao', 2, true);
```

### 2. Habilitar fallback de role na rota (`src/App.tsx`)
Alterar `fallbackToRoleCheck={false}` para `fallbackToRoleCheck={true}` (ou remover o prop, já que `true` é o padrão). Isso permite que usuários com roles admin/user acessem o módulo mesmo sem permissão granular configurada.

### 3. Conceder permissões padrão aos usuários existentes (migração SQL)
Inserir permissões de acesso ao módulo `planos-acao` para todos os usuários que já possuem permissões em outros módulos:

```sql
INSERT INTO user_module_permissions (user_id, module_id, can_access, can_create, can_read, can_update, can_delete)
SELECT DISTINCT ump.user_id, sm.id, true, true, true, true, false
FROM user_module_permissions ump
CROSS JOIN system_modules sm
WHERE sm.name = 'planos-acao'
AND NOT EXISTS (
  SELECT 1 FROM user_module_permissions existing
  WHERE existing.user_id = ump.user_id AND existing.module_id = sm.id
);
```

## Arquivos a editar
- `src/App.tsx` -- alterar `fallbackToRoleCheck` na rota `/planos-acao`

## Migração SQL
- Inserir módulo `planos-acao` em `system_modules`
- Conceder permissões padrão aos usuários existentes
