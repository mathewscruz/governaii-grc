

# Reestruturar Gestao de Permissoes

## Problema Atual

A Matriz de Permissoes atual exibe uma tabela gigante de **usuarios x modulos** (13 modulos x 5 permissoes = 65 checkboxes por usuario). Isso torna a gestao confusa e propensa a erros, especialmente com muitos usuarios.

## Solucao Proposta: Perfis de Permissao (Permission Profiles)

A ideia central e criar **perfis de permissao reutilizaveis** (ex: "Auditor", "Gestor de Riscos", "Apenas Leitura") que pre-definem todas as permissoes por modulo. Depois, basta associar um perfil a um ou mais usuarios.

### Como funciona na pratica

1. O admin cria perfis como "Auditor Interno" e define quais modulos esse perfil pode acessar/criar/editar/excluir
2. Ao cadastrar ou editar um usuario, seleciona o perfil desejado -- todas as permissoes sao aplicadas automaticamente
3. Se precisar de ajuste fino, pode personalizar permissoes individuais apos aplicar o perfil
4. Alterar um perfil pode ser replicado para todos os usuarios vinculados

### Fluxo do usuario

```text
+---------------------------+       +---------------------------+
|   Aba "Perfis"            |       |   Aba "Usuarios"          |
|                           |       |                           |
|  [+ Novo Perfil]          |       |  Lista de usuarios        |
|                           |       |  Cada usuario mostra:     |
|  Auditor Interno    (3)   |       |  - Nome / Email           |
|  Gestor de Riscos   (5)   |       |  - Perfil: "Auditor"      |
|  Analista LGPD      (2)   |       |  - Botao: Editar Perms    |
|  Acesso Total       (1)   |       |                           |
|  Somente Leitura    (4)   |       |  Ao clicar "Editar Perms" |
|                           |       |  abre dialog individual   |
+---------------------------+       +---------------------------+
```

## Mudancas no Banco de Dados

### Nova tabela: `permission_profiles`
- `id` (uuid, PK)
- `empresa_id` (uuid, FK empresas) -- isolamento por empresa
- `name` (text) -- ex: "Auditor Interno"
- `description` (text)
- `is_default` (boolean) -- perfil padrao para novos usuarios
- `created_by` (uuid)
- `created_at`, `updated_at`

### Nova tabela: `permission_profile_modules`
- `id` (uuid, PK)
- `profile_id` (uuid, FK permission_profiles)
- `module_id` (uuid, FK system_modules)
- `can_access`, `can_create`, `can_read`, `can_update`, `can_delete` (boolean)

### Alteracao na tabela `profiles`
- Adicionar coluna `permission_profile_id` (uuid, FK permission_profiles, nullable)

### RLS
- Ambas as tabelas com RLS habilitado e politicas por `empresa_id`
- Somente admin/super_admin podem criar/editar perfis

## Mudancas na Interface

### 1. Aba "Permissoes" reformulada (em Configuracoes)
Substituir a matriz atual por duas sub-abas:

**Sub-aba "Perfis de Permissao"**
- Lista de perfis em cards com nome, descricao e quantidade de usuarios vinculados
- Botao "+ Novo Perfil" abre dialog com:
  - Nome e descricao do perfil
  - Lista de modulos com toggles (switch) agrupados: Acessar | Criar | Ler | Editar | Excluir
  - Botoes de atalho: "Marcar Todos", "Somente Leitura", "Desmarcar Todos"
- Ao editar um perfil existente, opcao de "Aplicar alteracoes a todos os usuarios deste perfil"

**Sub-aba "Permissoes por Usuario"**
- Lista de usuarios com filtro/busca
- Cada usuario mostra o perfil atual em badge
- Botao "Gerenciar" abre dialog individual com:
  - Dropdown para selecionar perfil (aplica permissoes automaticamente)
  - Abaixo, lista de modulos com toggles para ajuste fino
  - Indicador visual quando permissao difere do perfil base (badge "Personalizado")

### 2. Integracao com Gerenciamento de Usuarios
- No dialog de criar/editar usuario, adicionar campo "Perfil de Permissao"
- Ao selecionar perfil, permissoes sao aplicadas automaticamente

### 3. Componentes a criar/modificar

| Componente | Acao |
|-----------|------|
| `PermissionProfileDialog.tsx` | Novo - Dialog para criar/editar perfis |
| `PermissionProfilesList.tsx` | Novo - Lista de perfis com cards |
| `UserPermissionDialog.tsx` | Novo - Dialog individual de permissoes por usuario |
| `PermissionMatrix.tsx` | Refatorar - Substituir matriz por sub-abas |
| `GerenciamentoUsuariosEnhanced.tsx` | Atualizar - Adicionar campo de perfil no dialog |
| `usePermissions.tsx` | Atualizar - Buscar profile_id e resolver permissoes |

### 4. Perfis padrao pre-cadastrados
Ao ativar o recurso, criar automaticamente:
- **Acesso Total** -- todos os modulos com todas as permissoes
- **Somente Leitura** -- todos os modulos apenas com leitura
- **Operacional** -- modulos principais com criar/ler/editar (sem excluir)

## Beneficios

- Reduz de 65+ checkboxes por usuario para 1 selecao de perfil
- Padroniza permissoes entre usuarios com mesma funcao
- Permite ajuste fino quando necessario
- Facilita onboarding de novos usuarios
- Auditoria clara: "Usuario X usa perfil Y com personalizacao Z"

