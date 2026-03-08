

# Varredura de Segurança Completa — Resultados

A varredura identificou **6 vulnerabilidades** no banco de dados e configuração, organizadas por severidade.

---

## CRITICO — 1. Qualquer usuário pode inserir registros em `temporary_passwords`

**Vulnerabilidade**: A policy `"Admins can insert temporary passwords"` usa `WITH CHECK (true)` para o role `public`. Qualquer pessoa (inclusive anônima) pode inserir um registro com `user_id` de um administrador, forçando um fluxo de "trocar senha" em contas que não controla.

**Impacto**: Escalação de privilégios / manipulação de fluxo de autenticação.

**Correção**: Restringir INSERT a admins autenticados da mesma empresa:
```sql
DROP POLICY "Admins can insert temporary passwords" ON temporary_passwords;
CREATE POLICY "Admins can insert temporary passwords" ON temporary_passwords
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_super_admin());
```

---

## ALTO — 2. Tabela `mfa_sessions` com RLS ativado mas ZERO policies

**Vulnerabilidade**: RLS está habilitado mas nenhuma policy existe. Resultado: ninguém consegue ler/inserir nessa tabela via client SDK. As edge functions usam `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS), então funcionam — mas se algum código client tentar acessar, falhará silenciosamente.

**Correção**: Criar policies básicas:
```sql
CREATE POLICY "Users can view own mfa sessions" ON mfa_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Service can insert mfa sessions" ON mfa_sessions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
```

---

## ALTO — 3. Denúncias: INSERT público sem validação de `empresa_id`

**Vulnerabilidade**: Duas policies permitem INSERT com `WITH CHECK (true)` — qualquer anônimo pode inserir denúncias com `empresa_id` arbitrário (incluindo empresas que não existem ou de terceiros).

**Correção**: Validar que o `empresa_id` corresponde a uma empresa ativa com canal de denúncias habilitado:
```sql
DROP POLICY "Public can insert denuncias via token" ON denuncias;
DROP POLICY "Public insert for denuncias" ON denuncias;
CREATE POLICY "Public can insert denuncias for active companies" ON denuncias
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM denuncias_configuracoes dc
      WHERE dc.empresa_id = denuncias.empresa_id AND dc.ativo = true
    )
  );
```

Fazer o mesmo para `denuncias_anexos` — restringir INSERT público para anexos vinculados a denúncias existentes:
```sql
DROP POLICY "Public can insert anexos via denuncia" ON denuncias_anexos;
CREATE POLICY "Public can insert anexos for existing denuncias" ON denuncias_anexos
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM denuncias WHERE id = denuncia_id)
  );
```

---

## MEDIO — 4. `denuncias_configuracoes`: emails internos expostos publicamente

**Vulnerabilidade**: A policy `"Public can view basic denuncia config"` retorna todas as colunas para `anon`, incluindo `emails_notificacao` (emails internos de compliance) e `notificar_administradores`.

**Correção**: Criar uma view pública que exclui colunas sensíveis e alterar a policy:
```sql
CREATE VIEW public.denuncias_configuracoes_public
WITH (security_invoker = on) AS
  SELECT id, empresa_id, ativo, token_publico, permitir_anonimas, 
         requerer_email, texto_apresentacao, politica_privacidade
  FROM public.denuncias_configuracoes;

-- Alterar policy para negar SELECT direto de anônimos
DROP POLICY "Public can view basic denuncia config" ON denuncias_configuracoes;
CREATE POLICY "Public can view basic denuncia config" ON denuncias_configuracoes
  FOR SELECT TO authenticated USING (ativo = true);
-- Anônimos acessam apenas via view
```

---

## MEDIO — 5. `gap_analysis_requirements`: leitura cross-tenant

**Vulnerabilidade**: A policy `"Users can view all requirements"` usa `USING (true)`, permitindo que qualquer autenticado veja requisitos de frameworks customizados de outras empresas (onde `empresa_id IS NOT NULL`).

**Correção**: Filtrar para templates globais OU frameworks da empresa do usuário:
```sql
DROP POLICY "Users can view all requirements" ON gap_analysis_requirements;
CREATE POLICY "Users can view requirements" ON gap_analysis_requirements
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gap_analysis_frameworks f
      WHERE f.id = framework_id
      AND (f.empresa_id IS NULL OR f.empresa_id = get_user_empresa_id())
    )
  );
```

---

## BAIXO — 6. Configurações de infraestrutura

- **Leaked Password Protection desabilitada**: Recomendo ativar no painel Supabase (Auth > Settings) para rejeitar senhas já vazadas em data breaches.
- **Postgres com patches de segurança disponíveis**: Recomendo fazer upgrade no painel Supabase (Settings > Infrastructure).
- Duas functions sem `search_path` definido (risco de search_path hijacking em cenários edge).

---

## Resumo

| # | Vulnerabilidade | Severidade | Tipo |
|---|-----------------|------------|------|
| 1 | `temporary_passwords` INSERT aberto | **Crítico** | Escalação de privilégios |
| 2 | `mfa_sessions` sem policies | **Alto** | Funcional/Segurança |
| 3 | `denuncias` INSERT sem validação | **Alto** | Injeção de dados cross-tenant |
| 4 | Emails compliance expostos publicamente | **Médio** | Vazamento de PII |
| 5 | Requirements leitura cross-tenant | **Médio** | Vazamento de dados |
| 6 | Leaked password + Postgres upgrade | **Baixo** | Infraestrutura |

**Plano**: Implementar as correções SQL dos itens 1 a 5 via migration, e ajustar o código frontend para usar a view `denuncias_configuracoes_public` nas páginas públicas. Os itens de infraestrutura (6) requerem ação manual no painel Supabase.

